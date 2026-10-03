out vec2 vTexCoord;

void main() {
    // Flip Y: Three.js PlaneGeometry UV origin is bottom-left
    // image data origin is in top-left
    vTexCoord = vec2(uv.x, 1.0 - uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
}