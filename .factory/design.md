# Voice Riff Loop design system

## Direction

**Cassette-era zine.** This is a pocket instrument, not a studio dashboard. It borrows the useful physical cues of a dubbed cassette: graphite plastic, a paper label, highlighter ink, punched holes, and a narrow strip of rhythm marks. The visual language makes four pads feel like four pieces of tape a maker can rearrange.

## Tokens

| Token | Value | Use |
|---|---|---|
| ink | `#171715` | primary text and dark surfaces |
| paper | `#f3ecd8` | page ground |
| label | `#fff8e7` | cassette labels and cards |
| moss | `#29463d` | secondary controls |
| orange | `#d84624` | record and stop emphasis |
| acid | `#d7e94b` | selected slice and focus details |
| blue | `#2756a5` | action controls |
| muted | `#5c584d` | supporting text |

The product is intentionally single-mode light paper. The cassette panel provides the dark treatment within the screen, rather than offering a generic theme switch.

## Type, spacing, and shapes

The display face is an italic, condensed system stack (`Impact`, `Arial Narrow`) for cut-out zine headlines. The body uses `ui-monospace` for timing labels and controls, which makes beats and milliseconds feel like a small instrument readout. No remote fonts load. The rhythm uses an 8 px scale. Tape labels have slightly clipped corners; controls are square, tactile, and use a 3 px hard shadow.

## Interaction and motion

Pressing a pad momentarily depresses it; the active beat travels along the tape strip. Transitions are 180 ms transform/opacity changes. At `prefers-reduced-motion: reduce`, the strip becomes a static active state and all transitions are removed. Focus is a thick acid outline.

## Original asset plan and provenance

Hero art: an original top-down cassette with a cut paper vocal waveform label. It was generated on 2026-09-02 with the factory `factory-image` deployment from the prompt recorded in `src/assets/hero-cassette.json`, reviewed for text/brand artifacts, and converted to WebP. It is used only as a decorative product-world illustration and contains no text that users must read.
