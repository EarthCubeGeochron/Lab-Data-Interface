import { hyperStyled } from "@macrostrat/hyper";
import { Switch, Route } from "react-router-dom";

import { ProjectMatch } from "~/model-views/project";
import { SampleMatch } from "../model-views/sample/list";
import { ProjectListComponent, SampleListComponent } from "./infinite-scroll";
import styles from "./module.styl";

const h = hyperStyled(styles);

export function SampleMainPanel() {
  const base = "/admin/sample";
  return h(Switch, [
    h(
      Route,
      {
        path: base + "/:id",
      },
      h(SampleMatch)
    ),
    h(Route, {
      path: base,
      component: () => h("div"),
    }),
  ]);
}

export function SampleAdminPage() {
  return h("div.admin-page-main", [
    h("div.left-panel", [h(SampleListComponent)]),
    h("div.right-panel", [h(SampleMainPanel)]),
  ]);
}