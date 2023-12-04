var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {

		// make a shadow first
		Ray shadowRay;
		// pass the struct's parameter with the method passing
		shadowRay.pos = position;
		// now we track the light to find the shadow direction
		shadowRay.dir = normalize(lights[i].position - position);

		// now check for the shadow, find the hintInf
		HitInfo shadowHitInfo;
		if(IntersectRay(shadowHitInfo,shadowRay)){
			continue;
		}

		// If not shadowed, perform shading using the Blinn model
		vec3 lightDir = normalize(lights[i].position - position);
        float diffuse = max(dot(normal, lightDir), 0.0);
        vec3 halfVec = normalize(lightDir + view);
        float specular = pow(max(dot(normal, halfVec), 0.0), mtl.n);
        vec3 lightContribution = (mtl.k_d * diffuse + mtl.k_s * specular) * lights[i].intensity;
        color += lightContribution;
	}
	return color;
}


// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
    hit.t = 1e30;
    bool foundHit = false;
    for ( int i = 0; i < NUM_SPHERES; ++i ) {
        vec3 oc = ray.pos - spheres[i].center;
        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant > 0.0) {
            float sqrtDiscriminant = sqrt(discriminant);
            float temp1 = (-b - sqrtDiscriminant) / (2.0 * a);
            float temp2 = (-b + sqrtDiscriminant) / (2.0 * a);
            float temp = min(temp1, temp2);
            if (temp < hit.t && temp > 0.001) {
                hit.t = temp;
                hit.position = ray.pos + ray.dir * hit.t;
                hit.normal = normalize(hit.position - spheres[i].center);
                hit.mtl = spheres[i].mtl;
                foundHit = true;
            }
        }
    }
    return foundHit;
}


// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer(Ray ray) {
    HitInfo hit;
    if (IntersectRay(hit, ray)) {
        vec3 view = normalize(-ray.dir);
        vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);

        // Compute reflections
        vec3 k_s = hit.mtl.k_s;
        for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
            if (bounce >= bounceLimit) break;
            if (hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0) break;

            Ray r; // Reflection ray
            HitInfo h; // Reflection hit info

            // Initialize the reflection ray
            r.pos = hit.position;
            r.dir = normalize(reflect(ray.dir, hit.normal));

            if (IntersectRay(h, r)) {
                // Hit found, so shade the hit point
                vec3 viewR = normalize(-r.dir);
                clr += k_s * Shade(h.mtl, h.position, h.normal, viewR);

                // Update the loop variables for tracing the next reflection ray
                ray = r;
                hit = h;
                k_s *= h.mtl.k_s; // Attenuate specular coefficient for next bounce
            } else {
                // Reflection ray did not intersect with anything, use environment color
                clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
                break; // No more reflections
            }
        }
        return vec4(clr, 1); // Return the accumulated color, including the reflections
    } else {
        // Ray did not hit any object, return environment color
        return vec4(textureCube(envMap, ray.dir.xzy).rgb, 0); 
    }
}

`;