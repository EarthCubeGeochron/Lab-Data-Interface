import React, { useState, useEffect } from "react";
import { List, Grid, AutoSizer } from "react-virtualized";
import VirDataSheet from "./vDataSheet";
import ReactDataSheet from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";

function DataSheet() {
  const [geo, setGeo] = useState([]);

  const [data, setData] = useState([]);

  useEffect(() => {
    getMarkers();
  }, []);

  async function getMarkers() {
    const response = await fetch(
      "https://sparrow-data.org/labs/wiscar/api/v1/sample?all=1"
    );
    const mrkers = await response.json();
    const markers = mrkers.filter((d) => d.geometry != null);
    const mutMarker = markers.map((sample) => {
      const {
        geometry: {
          coordinates: [longitude, latitude],
        },
        ...rest
      } = sample;
      const mutSample = { longitude, latitude, ...rest };
      return mutSample;
    });
    setGeo(mutMarker);
    const geoVal = mutMarker.map((obj) =>
      Object.values(obj).map((d) => ({ value: d }))
    );
    setData(geoVal);
  }
  if (geo.length === 0) {
    return null;
  }
  const geoCol = geo.map((obj) => Object.keys(obj).map((d) => ({ name: d })));
  const columns2 = geoCol[0];

  const sheetRender = (props) => {
    return (
      <table className={props.className}>
        <thead>
          <tr>
            <th>Index</th>
            {columns2.map((col) => (
              <th key={col.name}>{col.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>{props.children}</tbody>
      </table>
    );
  };

  const sheetRenderer = ({ virtualRowRenderer, data, className }) => (
    <List
      className={className}
      height={600}
      rowHeight={({ index }) => 20}
      rowRenderer={virtualRowRenderer}
      rowCount={data.length}
      width={600}
    />
  );

  const rowRender = (props) => {
    return (
      <tr>
        <td>{props.row}</td>
        {props.children}
      </tr>
    );
  };

  const onCellsChanged = (changes) => {
    const grid = data.map((row) => [...row]);
    changes.forEach(({ cell, row, col, value }) => {
      grid[row][col] = { ...grid[row][col], value };
    });
    setData(grid);
  };

  return (
    <virDataSheet
      data={data}
      valueRenderer={(cell) => cell.value}
      SheetRenderer={sheetRender}
      RowRenderer={rowRender}
      onCellsChanged={onCellsChanged}
    />
  );
}
export default DataSheet;
