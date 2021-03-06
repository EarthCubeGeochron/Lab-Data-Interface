import { useState, useEffect, useContext } from "react";
import { useModelEditor } from "@macrostrat/ui-components";
import { Button } from "@blueprintjs/core";
import { hyperStyled } from "@macrostrat/hyper";
import { ProjectFormContext } from "../../project/new-project";
import { ModelEditableText } from "./utils";
import { FormSlider } from "./utils";
//@ts-ignore
import styles from "./module.styl";

const h = hyperStyled(styles);

/**
 * Only needs 2 fields:
 *  Name,
 *  Orcid_id
 * Both text
 */
function ResearcherForm(props) {
  const { onSubmit } = props;
  const [researcher, setResearcher] = useState({ name: null, orcid: null });

  const onChangeName = (value) => {
    setResearcher((prevRes) => {
      return {
        ...prevRes,
        name: value,
      };
    });
  };
  const onChangeOrcid = (value) => {
    setResearcher((prevRes) => {
      return {
        ...prevRes,
        orcid: value,
      };
    });
  };
  const disabled = researcher.name ? false : true;

  return h("div.drawer-body", [
    h(ModelEditableText, {
      is: "h3",
      field: "name",
      placeholder: "Name your researcher",
      editOn: true,
      onChange: onChangeName,
      value: researcher.name,
      multiline: true,
    }),
    h(ModelEditableText, {
      is: "h3",
      field: "orcid_id",
      placeholder: "Add an Orcid id",
      editOn: true,
      onChange: onChangeOrcid,
      value: researcher.orcid,
      multiline: true,
    }),
    h(
      Button,
      {
        onClick: () => onSubmit(null, researcher.name, researcher.orcid),
        intent: "success",
        disabled,
      },
      ["Create new researcher"]
    ),
  ]);
}

export function AddResearcherDrawer(props) {
  const { onSubmit } = props;
  return h(FormSlider, {
    content: h(ResearcherForm, { onSubmit }),
    model: "researcher",
  });
}

export function NewProjNewResearcher() {
  const { dispatch } = useContext(ProjectFormContext);

  const onSubmit = (researcher) => {
    dispatch({
      type: "add_researcher",
      payload: { researcher_collection: [researcher] },
    });
  };
  return h(AddResearcherDrawer, { onSubmit });
}

export function EditProjNewResearcher({ onSubmit }) {
  return h(AddResearcherDrawer, { onSubmit });
}
