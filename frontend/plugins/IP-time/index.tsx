import h from "react-hyperscript";
import React from "react";
import styled from "@emotion/styled";
// import { appleStock } from '@vx/mock-data';
import { Group } from "@vx/group";
import { scaleTime, scaleLinear } from "@vx/scale";
import { AreaClosed } from "@vx/shape";
import { LinePath } from "@vx/shape";
import { AxisLeft, AxisBottom } from "@vx/axis";
import { LinearGradient } from "@vx/gradient";
import { extent, max } from "d3-array";
import { curveMonotoneX } from "@vx/curve";
import { Point } from "@vx/point";
import { MarkerCircle } from "@vx/marker";
import { useAPIResult } from "@macrostrat/ui-components";
import { Card, Spinner } from "@blueprintjs/core";
import ReactJSON from "react-json-view";
import { timeParse } from "d3-time-format";

const width = 800;
const height = 400;

const orange = "#ff9933";

// Bounds
const margin = {
  top: 60,
  bottom: 60,
  left: 80,
  right: 80,
};
const xMax = width - margin.left - margin.right;
const yMax = height - margin.top - margin.bottom;

function findDomain(xyData) {
  // console.log(xyData);
  return {
    xDomain: extent(xyData, (d) => d.x),
    yDomain: extent(xyData, (d) => d.y),
  };
}

//These need to change to pull from parameters in Sparrow.
const getX = (d) => d.x;
const getY = (d) => d.y;

// define a function for repetitive operations
function getDatum(analysis, parameter) {
  // Gets a datum for an analysis if it exists
  return analysis.data.find((d) => d.parameter == parameter);
}

const parseTime = timeParse("%Y%B%dT%H:%M:%S");

function IPtimeChartInner(props) {
  const { session_id } = props;
  const data = useAPIResult("/analysis", { session_id }, null);
  //console.log(data);
  if (data == null) return h(Spinner);
  const analysisData = data.map((d) => {
    const stage_X = new Date(d.date); //.find((d) => d.parameter == "INDEX");
    const stage_Y = d.data.find((d) => d.parameter == "IPnA");
    return { x: stage_X, y: stage_Y?.value };
  });

  //console.log(analysisData);

  //Culled nulls to see if it fixes the plot...
  const culledData = analysisData.filter((d) => d.x != null && d.y != null);
  // minor point but "camelCase" is standard for variables in JS.
  // "snake_case" for python. I didn't make the rules I just follow them :)
  // console.log(culledData);
  // console.log("HEELO");

  // now we have domains!
  const { xDomain, yDomain } = findDomain(culledData);
  // console.log(xDomain, yDomain);

  // Move scale creation inside render function, so we can set domains
  const xScale = scaleTime({
    range: [0, xMax],
    domain: xDomain,
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: yDomain,
  });

  return (
    <div>
      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          <MarkerCircle id="marker-circle-2" fill="#333" size={5} refX={2} />
          // This portion makes the x-y points show up on the plot.
          <LinePath
            data={culledData}
            x={(d) => xScale(getX(d))}
            y={(d) => yScale(getY(d))}
            markerMid="url(#marker-circle-2)"
            markerEnd="url(#marker-circle-2)"
          />
          <AxisLeft
            scale={yScale}
            top={0}
            left={0}
            label={"IP (nA)"}
            stroke={"#1b1a1e"}
            tickTextFill={"#1b1a1e"}
          />
          <AxisBottom
            scale={xScale}
            top={yMax}
            label={"Analysis Time and Date"}
            stroke={"#1b1a1e"}
            tickTextFill={"#1b1a1e"}
          />
        </Group>
      </svg>
    </div>
  );
}

function IPtimeChart(props) {
  return h(Card, {}, h(IPtimeChartInner, props));
}

export { IPtimeChart };

// import h from "react-hyperscript";
// import styled from "@emotion/styled";
// import { scaleLinear } from "@vx/scale";
// import { AxisLeft, AxisBottom } from "@vx/axis";
// import { useAPIResult } from "@macrostrat/ui-components";
// import { min, max, extent } from "d3-array";
// import { Card, Spinner } from "@blueprintjs/core";
// import ReactJSON from "react-json-view";
//
// let d = styled.div`\
// min-height: 200px;
// width: 10%;
// background: purple;
// margin-bottom: 1em;\
// `;
//
// const errorExtent = function (arr) {
//   const mn = min(arr, (d) => d.value - d.error);
//   const mx = max(arr, (d) => d.value + d.error);
//   return [mn, mx];
// };
//
// function findPlateauAge(data) {
//   const interpretedAges = data.filter((d) => d.session_index == null);
//   // Find plateau age
//   for (let a of Array.from(interpretedAges)) {
//     for (let datum of Array.from(a.data)) {
//       if (datum.parameter === "plateau_age") {
//         return datum;
//       }
//     }
//   }
// }
//
// function StepHeatingChartInner(props) {
//   const { session_id } = props;
//   const data = useAPIResult("/analysis", { session_id }, null);
//   if (data == null) return null
//   console.log(data)
//   const analysis_data = data.map(d => {
//     const stage_X = d.data.find(d => d.parameter == "X")
//     const stage_Y = d.data.find(d => d.parameter == "Y")
//     return [stage_X?.value, stage_Y?.value]
//   })
//   return h(ReactJSON, {src: analysis_data});
//
//   const width = 450;
//   const height = 450;
//
//   const margin = 50;
//   const innerWidth = width - 2 * margin;
//   const innerHeight = height - 2 * margin;
//
//   const xScale = scaleLinear({
//     range: [0, innerWidth],
//     domain: [0, heatingSteps.length],
//   });
//
//   const yScale = scaleLinear({
//     range: [innerHeight, 0],
//     domain: yExtent,
//   });
//
//   const deltaX = xScale(1) - xScale(0);
//
//   return h(
//     "svg.step-heating-chart",
//     {
//       width: 900,
//       height,
//     },
//     [
//       h(
//         "g.chart-main",
//         {
//           transform: `translate(${margin},${margin})`,
//         },
//         [
//           h("g.data-area", [
//             h(
//               "g.heating-steps",
//               ages.map(function (d, i) {
//                 const { age, in_plateau } = d;
//                 const mn = age.value - age.error;
//                 const mx = age.value + age.error;
//                 const y = yScale(mx);
//
//                 return h("rect", {
//                   x: xScale(i),
//                   y,
//                   width: deltaX,
//                   height: yScale(mn) - y,
//                   fill: in_plateau ? "#444" : "#aaa",
//                 });
//               })
//             ),
//             h("g.plateau-age", [
//               h("rect", {
//                 x: xScale(plateauIx[0]),
//                 y: yScale(plateauAge.value + plateauAge.error),
//                 width: deltaX * (1 + plateauIx[1] - plateauIx[0]),
//                 height: yScale(0) - yScale(2 * plateauAge.error),
//                 stroke: "#222",
//                 "stroke-width": "2px",
//                 fill: "transparent",
//               }),
//             ]),
//           ]),
//           h(AxisBottom, {
//             scale: xScale,
//             numTicks: 10,
//             top: innerHeight,
//             label: "Stage X (micrometers)",
//             labelOffset: 15,
//           }),
//           h(AxisLeft, {
//             scale: yScale,
//             numTicks: 10,
//             label: "Stage Y (micrometers)",
//             labelOffset: 30,
//           }),
//         ]
//       ),
//     ]
//   );
// }
//
// function MountMapChart(props) {
//   return h(Card, {}, h(StepHeatingChartInner, props));
// }
//
// export { MountMapChart };
