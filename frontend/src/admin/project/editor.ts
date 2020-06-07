/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {useContext, useState} from 'react';
import {hyperStyled} from '@macrostrat/hyper';
import {
  EditableText, Intent, Switch,
  Alignment, Button, Popover, ButtonGroup,
  Menu, MenuItem
} from '@blueprintjs/core';
import T from 'prop-types';
import {useAuth} from '../../auth';
import {
  ModelEditor, ModelEditorContext, ModelEditButton,
  CancelButton, SaveButton, useModelEditor,
  APIContext
} from '@macrostrat/ui-components';
import {MinimalNavbar} from 'app/components/navbar';
import {put} from 'axios';

import classNames from 'classnames';
import '../main.styl';
import styles from '../module.styl';
const h = hyperStyled(styles);

const ModelEditableText = function(props){
  const el = props.is || 'div';
  let {multiline, field, placeholder, ...rest} = props;
  if (placeholder == null) { placeholder = "Add a "+field; }
  delete rest.is;
  const {model, actions, isEditing} = useContext(ModelEditorContext);

  // Show text with primary intent if changes have been made
  const intent = actions.hasChanges(field) ? Intent.SUCCESS : null;

  return h(el, rest, [
    h.if(isEditing)(EditableText, {
      className: `model-edit-text field-${field}`,
      multiline,
      placeholder,
      intent,
      onChange: actions.onChange(field),
      value: model[field]
    }),
    h.if(!isEditing)('span', model[field])
  ]);
};

const EmbargoEditor = function(props){
  const {login} = useAuth();
  const {model, actions, isEditing} = useContext(ModelEditorContext);
  const [isOpen, setOpen] = useState(false);
  const text = (model.embargo_date != null) ? "Embargoed" : "Public";
  const icon = (model.embargo_date != null) ? "lock" : "unlock";
  if (!login) { return null; }
  return h('div.embargo-editor', [
    h(Popover, {
      position: 'bottom',
      isOpen,
      onClose: evt=> {
        console.log(evt);
        return setOpen(false);
      }
    }, [
      h(Button, {
        text, minimal: true, interactive: false,
        rightIcon: icon, intent: Intent.SUCCESS,
        onClick() { return setOpen(!isOpen); }
      }),
      h('div.embargo-control-panel', [
        h(Switch, {
          checked: (model.embargo_date != null),
          label: "Embargoed",
          alignIndicator: Alignment.RIGHT,
          onChange(evt){
            const {checked} = evt.target;
            const val = checked ? "+Infinity" : null;
            return actions.persistChanges({embargo_date: {$set: val}});
          }
        })
      ])
    ])
  ]);
};

const EditStatusButtons = function() {
  const {isEditing, hasChanges, actions} = useModelEditor();
  const changed = hasChanges();
  return h('div.edit-status-controls', [
    h.if(!isEditing)(ModelEditButton, {minimal: true}, "Edit"),
    h.if(isEditing)(ButtonGroup, {minimal: true}, [
      h(SaveButton, {
        disabled: !changed,
        onClick() { return actions.persistChanges(); }
      }, "Save"),
      h(CancelButton, {
        intent: changed ? "warning" : "none",
        onClick: actions.toggleEditing
      }, "Done")
    ])
  ]);
};


const EditableProjectDetails = function(props){
  const {project} = props;
  const {login} = useAuth();
  const {helpers: {buildURL}} = useContext(APIContext);

  return h(ModelEditor, {
    model: project,
    canEdit: login,
    persistChanges: async (updatedModel, changeset)=> {
      let rest;
      let {id} = updatedModel;
      const response = await put(buildURL(`/edit/project/${id}`), changeset);
      const {data} = response;
      ({id, ...rest} = data);
      return rest;
    }
  }, [
    h('div.project-editor', [
      h.if(login)(MinimalNavbar, {className: 'project-editor-navbar'}, [
        h('h4', "Manage project"),
        h(EditStatusButtons),
        h(EmbargoEditor)
      ]),
      h('div.project-editor-content', [
        h(ModelEditableText, {is: 'h3', field: 'name', multiline: true}),
        h(ModelEditableText, {is: 'p', field: 'description', multiline: true})
      ])
    ])
  ]);
};


export {EditableProjectDetails};