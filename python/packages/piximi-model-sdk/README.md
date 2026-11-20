# piximi-model-sdk

What a Piximi model plugin implements. A plugin is a folder holding a
`piximi-model.toml` manifest and a Python module:

```
my-plugin/
  piximi-model.toml
  model.py
```

The manifest names the plugin, lists the packages its environment needs,
and describes each model to the UI (channel and output policies, option
fields). The engine builds that environment the first time the model is
loaded and runs the module inside it, so the module may depend on anything:

```python
# model.py
import numpy as np
from piximi_model_sdk import Context, SegmentationModel


class Threshold(SegmentationModel):
    def load(self, ctx: Context) -> None:
        ctx.progress("Nothing to load", 100)

    def segment(self, image: np.ndarray, options: dict, ctx: Context) -> np.ndarray:
        from scipy import ndimage

        plane = image[0]
        labels, _ = ndimage.label(plane > options["threshold"])
        return labels


MODEL = Threshold()
```

```toml
# piximi-model.toml
[plugin]
id = "my-threshold"
name = "My threshold"
framework = "scipy"
entry = "model.py"

[plugin.env]
python = "3.12"
requirements = ["scipy"]

[[models]]
id = "my-threshold"
attribute = "MODEL"
display_name = "My threshold"
description = "Labels connected components above a level"
use = "Bright objects on a dark background"
output = { mode = "single", default_kind_name = "Object" }
channels = { mode = "passthrough", max_channels = 1 }

[[models.options.groups]]
id = "threshold"
label = "Threshold"
fields = [{ key = "threshold", type = "number", label = "Level", default = 128 }]
```

`segment` gets the plane as a `(C, Y, X)` array and returns a label image
(or a `LabelResult` naming a kind per object). `ctx.progress()` reports
progress and `ctx.check_cancelled()` stops cooperatively.

A plugin can also offer a classifier architecture, with
`tasks = ["classification", "classification.train"]` and no `output`
policy. The module then provides a `ClassificationModel`: `build` makes
fresh weights for the project's categories, `fit` trains on `(N, C, H, W)`
arrays the engine prepared (calling `ctx.epoch(...)` after each epoch and
returning early once `ctx.cancelled`), `predict` returns `(N, classes)`
probabilities, and `save`/`load` carry the weights as bytes. `options`
holds the user's optimizer settings (`learningRate`, `epochs`, `batchSize`,
`optimizationAlgorithm`, `lossFunction`). The engine's
`tests/plugins/logistic-numpy` is a complete example.

Register the folder with `piximi serve --models-dir`, from a notebook with
`session.project.register_model("my-plugin")`, or from an installed package
through a `piximi.models` entry point whose value is the manifest's path.
