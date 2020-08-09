import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Drawer,
  Toaster,
  Toast,
  Position,
} from "@blueprintjs/core";
import { useAPIResult } from "./APIResult";
import { AppToaster } from "../../toaster";

/* This component will Handle the drawer or whatever 
info box we decide on to display data from the MacroStrat 
API based on a click on the map */

// USE TOASTER it'll be way cooler

export function MapDrawer({ drawOpen, closeToast, clickPnt }) {
  const [macrostratData, setMacrostratData] = useState([]);

  // url to queary macrostrat
  const MacURl = "https://macrostrat.org/api/v2/geologic_units/map";

  const MacostratData = useAPIResult(MacURl, {
    lng: clickPnt.lng,
    lat: clickPnt.lat,
  });

  useEffect(() => {
    if (MacostratData == null) return;
    setMacrostratData(MacostratData.success.data);
    console.log(macrostratData);
  }, [MacostratData]);

  return (
    <div>
      <Toaster >
        <Toast>
          {macrostratData.map((object) => {
            return (
              <div>
                <p key={object.name}>{"Name: " + object.name}</p>
                <p key={object.lith}>{"Lithology: " + object.lith}</p>
              </div>
            );
          })}
        </Toast>
      </Toaster>
    </div>
  );
}
