precision highp float;
precision highp sampler2DArray;

#define MAX_CHANNELS 16

uniform sampler2DArray uChannels;
uniform int       uChannelCount;
uniform vec3      uColorMaps[MAX_CHANNELS];
uniform float     uRampMins[MAX_CHANNELS];
uniform float     uRampMaxes[MAX_CHANNELS];
uniform float     uVisible[MAX_CHANNELS];

in  vec2 vTexCoord;
out vec4 outColor;

  void main() {
    vec3 color = vec3(0.0);
    for (int i = 0; i < MAX_CHANNELS; i++) {
      if (i >= uChannelCount) break;
      if (uVisible[i] < 0.5) continue;
      float raw   = texture(uChannels, vec3(vTexCoord, float(i))).r;  // dynamic layer index ✓
      float range = uRampMaxes[i] - uRampMins[i];
      float t     = (range > 0.0) ? clamp((raw - uRampMins[i]) / range, 0.0, 1.0) : 0.0;
      color += t * uColorMaps[i];
    }
    outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }