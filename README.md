# <before-after>

A custom element that wipes between two versions of the same thing — a photo before and after grading, a screen before and after a redesign, a function before and after a refactor. Drag the handle or focus it and use the arrow keys.

## Install

Drop `before-after.es.js` next to your page and load it as a module. The element registers itself; there is nothing to initialise and nothing to import.

```html
<script type="module" src="before-after.es.js"></script>

<before-after
  before-src="raw.jpg"   before-alt="Straight out of camera"
  after-src="graded.jpg" after-alt="Colour graded"
  before-label="Original"
  after-label="Graded"
  value="50"></before-after>
```

Both panes accept arbitrary markup instead, via the before and after slots. Whatever is in them gets clipped, so the two sides should share the same geometry — same box, same padding, same line height — or the wipe will not line up.

```html
<before-after>
  <div slot="before"><!-- any HTML --></div>
  <div slot="after"><!-- any HTML --></div>
</before-after>
```

## API

TODO: Make this section a markdown table.

| Attribute                  | Type                   | Default                     | Notes                                                                                                                                                                            |
|----------------------------|------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| value                      | 0–100                  | 50                          | Divider position as a percentage. Sets the starting position and moves the divider whenever it changes; it is not written back during a drag — read the value property for that. |
| orientation                | horizontal \| vertical | horizontal                  | Axis the divider travels along. Vertical puts the before pane on top.                                                                                                            |
| before-src / after-src     | url                    | —                           | Shorthand for a plain image pane. Ignored for a side that has slotted content.                                                                                                   |
| before-alt / after-alt     | string                 | ""                          | Alt text for those images. Empty alt marks the image decorative.                                                                                                                 |
| before-label / after-label | string                 | —                           | Caption chips pinned to the top corners. Each one sits inside its own pane, so it wipes away with it.                                                                            |
| label                      | string                 | Before and after comparison | Accessible name for the slider.                                                                                                                                                  |
| grab                       | handle \| anywhere     | handle                      | Where a drag can start. The default keeps clicks on slotted links and buttons working; anywhere trades that for a larger target.                                                 |
| step                       | number                 | 1                           | Percentage points per arrow key press. Page Up / Page Down move ten steps.                                                                                                       |
| aspect                     | ratio                  | —                           | Forces the frame ratio, e.g. 16 / 9. Without it the element takes its ratio from the first image, or from the taller pane when the panes are markup.                             |
| disabled                   | boolean                | false                       | Freezes the divider and removes the handle from the tab order.                                                                                                                   |

## Properties and events

| Member      | Kind      | Notes                                                                                                                                          |
|-------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------|
| value       | get / set | Live position as a number. Setting it moves the divider without firing an event.                                                               |
| orientation | get / set | Reflects the attribute.                                                                                                                        |
| disabled    | get / set | Reflects the attribute.                                                                                                                        |
| input       | event     | Fires on every movement, including each arrow key press. event.detail.value carries the position.                                              |
| change      | event     | Fires once the gesture ends — pointer released, or key released — and only if the divider actually moved. Use this one for anything expensive. |

## Styling

| Custom property    | Default          | Affects                 |
|--------------------|------------------|-------------------------|
| --ba-divider-width | 2px              | Thickness of the seam   |
| --ba-divider-color | #fff             | Seam colour             |
| --ba-handle-size   | 44px             | Handle diameter         |
| --ba-handle-bg     | #fff             | Handle fill             |
| --ba-handle-color  | #111             | Chevron colour          |
| --ba-radius        | 0                | Frame corner radius     |
| --ba-object-fit    | cover            | Fit of slotted media    |
| --ba-label-bg      | rgb(0 0 0 / .55) | Caption chip background |
| --ba-label-color   | #fff             | Caption chip text       |
| --ba-focus-ring    | #0aa             | Focus outline colour    |

For anything the custom properties do not reach, the shadow parts are exposed: frame, pane, before, after, divider, handle and label.

## Behavior

### Keyboard

| Key                                     | Result                               |
|-----------------------------------------|--------------------------------------|
| <kbd>←</kbd> <kbd>↑</kbd>               | Move one step toward the before side |
| <kbd>→</kbd> <kbd>↓</kbd>               | Move one step toward the after side  |
| <kbd>Page Up</kbd> <kbd>Page Down</kbd> | Move ten steps                       |
| <kbd>Home</kbd> <kbd>End</kbd>          | Jump to 0% or 100%                   |

### Worth knowing

* The handle is a real button carrying role="slider", so it is tabbable, announces its position, and works inside a form without submitting it.
* Panes are stacked in one grid cell, so the frame is as tall as the taller side and nothing is cropped by surprise.
* Clipping is clip-path on percentages. Resizing the element needs no JavaScript and no re-measure.
* Pointer capture is taken on the frame, so a drag survives the pointer leaving the element.
* Keyboard moves are eased; pointer drags are not. Under prefers-reduced-motion nothing is eased.
* The divider position is a percentage of the frame, never a pixel offset, so it holds through layout changes and zoom.

## Code of Conduct

This project has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its code of conduct. For more information, see the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file.

## Security Vulnerabilities

See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## Acknowledgements

This project was inspired by the need for a simple and accessible way to compare two versions of content. Special thanks to the open-source community for their contributions and feedback.
