precision highp float;

uniform sampler2D uMask;
uniform vec3  uColor;
uniform float uInteriorAlpha;
uniform float uBorderAlpha;

in  vec2 vTexCoord;
out vec4 outColor;

// Out of bounds reads as background, so the bbox edge counts as border.
float maskAt(ivec2 p, ivec2 size) {
    if (p.x < 0 || p.y < 0 || p.x >= size.x || p.y >= size.y) return 0.0;
    return texelFetch(uMask, p, 0).r;
}

void main() {
    ivec2 size = textureSize(uMask, 0);
    ivec2 p = clamp(ivec2(vTexCoord * vec2(size)), ivec2(0), size - ivec2(1));

    if (maskAt(p, size) <= 0.0) discard;

    bool border =
        maskAt(p + ivec2( 0,  1), size) <= 0.0 ||
        maskAt(p + ivec2( 1,  0), size) <= 0.0 ||
        maskAt(p + ivec2( 0, -1), size) <= 0.0 ||
        maskAt(p + ivec2(-1,  0), size) <= 0.0;

    outColor = vec4(uColor, border ? uBorderAlpha : uInteriorAlpha);
}