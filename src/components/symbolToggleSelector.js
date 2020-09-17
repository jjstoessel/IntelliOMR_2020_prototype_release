import React from "react";

export default class SymbolToggleSelector extends React.Component {
  click(icon) {
    if (this.props.selected === icon) icon = null;
    this.props.select(icon);
  }

  render() {
    const icons = this.props.icons;
    const selected = this.props.selected;
    return (
      <div>
        {icons.map((icon) => (
          <div
            key={icon.id}
            className={selected === icon.id ? "selectedMusicIcon" : "musicIcon"}
            onClick={() => this.click(icon.id)}
          >
            <img alt="" src={icon.icon} />
          </div>
        ))}
      </div>
    );
  }
}
