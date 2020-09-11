import * as React from "react";
import {
  Menu,
  MenuItem,
  MenuDivider,
  Icon,
  Popover,
  Tooltip,
  Button,
  Position,
  InputGroup,
} from "@blueprintjs/core";
import "../cluster.css";
import h from "@macrostrat/hyper";

export const LayerMenu = ({
  hide,
  MapStyle,
  chooseMapStyle,
  mapstyles,
  showMarkers,
  toggleShowMarkers,
}) => {
  const dropMenu = (
    <Menu>
      {mapstyles.map((styleOb) => {
        const { name, style } = styleOb;
        return (
          <MenuItem
            intent={MapStyle == style ? "primary" : null}
            labelElement={MapStyle == style ? <Icon icon="tick"></Icon> : null}
            text={name}
            onClick={() => chooseMapStyle(style)}
          />
        );
      })}

      <MenuDivider />
      <MenuItem
        label={showMarkers ? "On" : "Off"}
        intent={showMarkers ? "warning" : null}
        onClick={() => toggleShowMarkers()}
        text="Markers"
      />
    </Menu>
  );
  return (
    <div>
      {hide ? null : (
        <div className="mappagemenu">
          <Popover content={dropMenu} minimal={true} position={Position.BOTTOM}>
            <Tooltip content="Change Map">
              <Button icon="layers"></Button>
            </Tooltip>
          </Popover>
        </div>
      )}
    </div>
  );
};
