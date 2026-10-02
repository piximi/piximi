/*
 * What a model's annotations are kinded as.
 *
 * - `single`: every annotation lands in one kind, whose name the user may
 *   override from the model settings panel.
 * - `classes`: the kind comes from the detection itself, so there is one kind
 *   per output class and nothing for the user to name.
 */
export enum OUTPUT_MODE {
  SINGLE = "single",
  CLASSES = "classes",
}
