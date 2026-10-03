import { useState } from "react";
import { Check, ChevronRight, Palette, Store } from "lucide-react";
import { THEME_PRESETS, type ThemePresetId } from "@/domain/theme";
import { BrowserPreview } from "./ProductPreview";

const areas = [
  "Store Details",
  "Theme",
  "Homepage",
  "Products",
  "Delivery",
  "Payments",
] as const;
type Area = (typeof areas)[number];
const notes: Record<Area, string> = {
  "Store Details": "Set your store name and branding in Store Settings.",
  Theme: "Choose from the five Store Design families. Try a theme below.",
  Homepage: "Edit homepage sections in Store Builder. Try the heading below.",
  Products: "Manage product images, prices and stock in Products.",
  Delivery: "Set delivery options and township fees in Delivery settings.",
  Payments:
    "Configure KBZPay and WavePay accounts in Payment settings. COD is also supported.",
};
export function BuilderDemo() {
  const [area, setArea] = useState<Area>("Theme");
  const [theme, setTheme] = useState<ThemePresetId>("clean-minimal");
  const [name, setName] = useState("The Everyday Edit");
  const [headline, setHeadline] = useState("Good things. Everyday.");
  return (
    <div className="mm-builder">
      <div className="mm-builder-toolbar">
        <span>
          <Store size={17} aria-hidden="true" /> Store Builder{" "}
          <small>Interactive example</small>
        </span>
        <span className="mm-draft">
          <Check size={14} aria-hidden="true" /> Preview only
        </span>
      </div>
      <div className="mm-builder-workspace">
        <div className="mm-builder-controls">
          <div
            className="mm-builder-nav"
            role="group"
            aria-label="Explore store management areas"
          >
            {areas.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={area === item}
                onClick={() => setArea(item)}
              >
                {item}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="mm-builder-settings">
            <p>{notes[area]}</p>
            {area === "Theme" && (
              <fieldset>
                <legend>
                  <Palette size={14} aria-hidden="true" /> Store theme
                </legend>
                <div className="mm-theme-options">
                  {Object.entries(THEME_PRESETS).map(([id, preset]) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={theme === id}
                      onClick={() => setTheme(id as ThemePresetId)}
                    >
                      {preset.shortLabel}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {area === "Store Details" && (
              <label>
                Store name
                <input
                  value={name}
                  maxLength={40}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}
            {area === "Homepage" && (
              <label>
                Hero heading
                <input
                  value={headline}
                  maxLength={60}
                  onChange={(event) => setHeadline(event.target.value)}
                />
              </label>
            )}
          </div>
        </div>
        <div className="mm-builder-canvas">
          <BrowserPreview
            theme={theme}
            shopName={name || "Your store"}
            headline={headline || "Your collection"}
            compact
            interactive={false}
          />
          <p className="mm-caption">
            Illustrative preview · Changes here are not saved. In your store,
            edit a Draft and Publish when ready.
          </p>
        </div>
      </div>
    </div>
  );
}
