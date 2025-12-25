uniform sampler2D tex;
uniform float target_lum;
uniform float lum_blend;

vec3 rgb_to_hsl(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsl_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 background = texture2D(tex, cogl_tex_coord_in[0].st);

    // Fill 1: Set the luminosity to a consistent value.
    vec3 hsl = rgb_to_hsl(background.rgb);
    hsl.z = target_lum;
    vec3 new_lum = hsl_to_rgb(hsl);

    background.rgb = mix(background.rgb, new_lum, lum_blend);

    // Fill 2: Darken everything. Equivalent of #cfcfcf with PLUS DARKER blend mode at 66% opacity
    /* TODO: This is only helpful for dark themes. The color effect can't accomplish the same thing, so I should probably make a new effect
       for it instead of joining it with this. */
    vec3 fill2 = vec3(0.811, 0.811, 0.811); // #cfcfcf
    // Plus Darker: background + fill - 1 (clamped to 0)
    vec3 darkened = max(background.rgb + fill2 - vec3(1.0), vec3(0.0));
    background.rgb = mix(background.rgb, darkened, 0.66);

    cogl_color_out = background;
}