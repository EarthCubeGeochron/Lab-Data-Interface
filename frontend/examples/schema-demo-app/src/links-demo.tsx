import React, { useState } from "react";
import { Group } from "@visx/group";
import { hierarchy, Tree } from "@visx/hierarchy";
import { LinearGradient } from "@visx/gradient";
import { LinkHorizontal } from "@visx/shape";
import { pointRadial } from "d3-shape";
import useDimensions from "react-use-dimensions";

function useForceUpdate() {
  const [, setValue] = useState<number>(0);
  return () => setValue((value) => value + 1); // update state to force render
}

interface TreeNode {
  name: string;
  isExpanded?: boolean;
  children?: TreeNode[];
}

const data: TreeNode = {
  name: "Sparrow User API",
  children: [
    {
      name: "Concordia parameters",
      children: [
        { name: "Error correlation" },
        { name: "206Pb/238U ratio" },
        { name: "207Pb/238U ratio" },
        {
          name: "C",
          children: [
            {
              name: "C1",
            },
            {
              name: "D",
              children: [
                {
                  name: "D1",
                },
                {
                  name: "D2",
                },
                {
                  name: "D3",
                },
              ],
            },
          ],
        },
      ],
    },
    { name: "Z" },
    {
      name: "B",
      children: [{ name: "B1" }, { name: "B2" }, { name: "B3" }],
    },
  ],
};

const defaultMargin = { top: 30, left: 30, right: 30, bottom: 70 };

export type LinkTypesProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default function Example({ margin = defaultMargin }: LinkTypesProps) {
  const [stepPercent, setStepPercent] = useState<number>(0.5);
  const [ref, { width: totalWidth, height: totalHeight }] = useDimensions();
  const forceUpdate = useForceUpdate();

  const innerWidth = totalWidth - margin.left - margin.right;
  const innerHeight = totalHeight - margin.top - margin.bottom;
  const origin = { x: 0, y: 0 };
  const sizeWidth = innerHeight;
  const sizeHeight = innerWidth;

  return totalWidth < 10 ? null : (
    <div className="linker-ui-workspace" ref={ref}>
      <svg width={totalWidth} height={totalHeight}>
        <LinearGradient id="links-gradient" from="#cccccc" to="#dddddd" />
        <rect width={totalWidth} height={totalHeight} rx={14} fill="#dddddd" />
        <Group top={margin.top} left={margin.left + sizeHeight}>
          <Tree
            root={hierarchy(data, (d) => (d.isExpanded ? null : d.children))}
            size={[sizeWidth, -sizeHeight]}
            separation={(a, b) => (a.parent === b.parent ? 1 : 0.5) / a.depth}
          >
            {(tree) => (
              <Group top={origin.y} left={origin.x}>
                {tree.links().map((link, i) => {
                  console.log(link);
                  return (
                    <LinkHorizontal
                      key={i}
                      data={link}
                      percent={stepPercent}
                      stroke="#4af2a1"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                })}

                {tree.descendants().map((node, key) => {
                  const width = 80;
                  const height = 30;

                  let top = node.x;
                  let left = node.y;

                  return (
                    <Group top={top} left={left} key={key}>
                      {node.depth === 0 && (
                        <rect
                          height={30}
                          width={30}
                          y={-15}
                          x={-15}
                          fill="salmon"
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log(node);
                            forceUpdate();
                          }}
                        />
                      )}
                      {node.depth !== 0 && (
                        <rect
                          height={height}
                          width={width}
                          y={-height / 2}
                          x={-width / 2}
                          fill="#ffffff"
                          stroke="#888888"
                          strokeWidth={1}
                          strokeDasharray={node.data.children ? "0" : "2,2"}
                          strokeOpacity={node.data.children ? 1 : 0.6}
                          rx={node.data.children ? 0 : 4}
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log(node);
                            forceUpdate();
                          }}
                        />
                      )}
                      <text
                        dy=".33em"
                        fontSize={9}
                        fontFamily="Arial"
                        textAnchor="middle"
                        style={{ pointerEvents: "none" }}
                        fill="black"
                      >
                        {node.data.name}
                      </text>
                    </Group>
                  );
                })}
              </Group>
            )}
          </Tree>
        </Group>
      </svg>
    </div>
  );
}
