import { hyperStyled } from "@macrostrat/hyper";
import {
  ProjectModelCard,
  SampleModelCard,
  SessionListModelCard,
  DataFileModelCard,
  PublicationModelCard,
  ResearcherModelCard,
} from "~/model-views";
import { InfiniteAPIView } from "~/components/infinite-scroll";
import { APIV2Context } from "~/api-v2";
//@ts-ignore
import styles from "./main.styl";

const h = hyperStyled(styles);

// unwraps the data to be simpatico with the ProjectLink component, also gets the next page
function unwrapProjectCardData(data) {
  const dataObj = data.data.map((obj) => {
    const { id, name, description, publication, sample, session } = obj;
    return { id, name, description, publication, sample, session };
  });
  return dataObj;
}

const ProjectListComponent = ({ params, componentProps = {} }) => {
  return h("div", { style: { padding: "1px" } }, [
    h(InfiniteAPIView, {
      url: "/models/project",
      unwrapData: unwrapProjectCardData,
      params: {},
      filterParams: { ...params },
      component: ProjectModelCard,
      componentProps,
      context: APIV2Context,
      modelName: "Project",
    }),
  ]);
};

function unwrapSampleCardData(data) {
  const dataObj = data.data.map((obj) => {
    const { id, name, material, location, session } = obj;
    return { id, name, material, location, session };
  });
  return dataObj;
}

function SampleListComponent({ params }) {
  return h("div", [
    h(InfiniteAPIView, {
      url: "/models/sample",
      unwrapData: unwrapSampleCardData,
      params: { nest: "session" },
      filterParams: { ...params },
      component: SampleModelCard,
      context: APIV2Context,
      modelName: "Sample",
    }),
  ]);
}

function unwrapSessionCardData(data) {
  const dataObj = data.data.map((obj) => {
    const {
      id: session_id,
      technique,
      target,
      date,
      instrument,
      data,
      analysis,
      sample,
    } = obj;
    return {
      session_id,
      technique,
      target,
      date,
      data,
      instrument,
      analysis,
      sample,
    };
  });
  return dataObj;
}

function SessionListComponent({ params, componentProps = {} }) {
  return h("div", { style: { padding: "1px" } }, [
    h(InfiniteAPIView, {
      url: "/models/session",
      unwrapData: unwrapSessionCardData,
      params: { nest: "instrument,sample" },
      filterParams: { ...params },
      component: SessionListModelCard,
      componentProps,
      context: APIV2Context,
      modelName: "Session",
    }),
  ]);
}

function unwrapDataFileCardData(data) {
  const dataObj = data.data.map((obj) => {
    if (obj.data_file_link.length > 0) {
      const {
        basename,
        file_hash,
        type,
        data_file_link: [{ date }],
        data_file_link,
      } = obj;
      return { basename, file_hash, type, date, data_file_link };
    }
    const { basename, file_hash, type } = obj;
    return { basename, file_hash, type };
  });
  return dataObj;
}

function DataFilesListComponent({ params }) {
  return h("div", { style: { padding: "1px" } }, [
    h(InfiniteAPIView, {
      url: "/models/data_file",
      unwrapData: unwrapDataFileCardData,
      params: {
        nest: "data_file_link,sample,session",
        has: "data_file_link",
      },
      filterParams: { ...params },
      component: DataFileModelCard,
      context: APIV2Context,
      modelName: "Datafile",
    }),
  ]);
}

function SampleAddList({ params, componentProps }) {
  return h("div", [
    h(InfiniteAPIView, {
      url: "/models/sample",
      unwrapData: unwrapSampleCardData,
      params: { nest: "session" },
      filterParams: { ...params },
      component: SampleModelCard,
      componentProps,
      context: APIV2Context,
      modelName: "Sample",
    }),
  ]);
}

const unwrapPubs = (data) => {
  const dataObj = data.data.map((obj) => {
    const { year, id, title, doi, author, journal } = obj;
    return { year, id, title, doi, author, journal };
  });
  return dataObj;
};

function PublicationAddList({ params, componentProps }) {
  return h("div", [
    h(InfiniteAPIView, {
      url: "/models/publication",
      unwrapData: unwrapPubs,
      params: {},
      filterParams: { ...params },
      component: PublicationModelCard,
      componentProps,
      context: APIV2Context,
      modelName: "Publication",
    }),
  ]);
}

const unwrapResearchers = (data) => {
  const dataObj = data.data.map((obj) => {
    const { id, name } = obj;
    return { id, name };
  });
  return dataObj;
};

function ResearcherAddList({ params, componentProps }) {
  return h("div", [
    h(InfiniteAPIView, {
      url: "/models/researcher",
      unwrapData: unwrapResearchers,
      params: {},
      filterParams: { ...params },
      component: ResearcherModelCard,
      componentProps,
      context: APIV2Context,
      modelName: "Researcher",
    }),
  ]);
}

export {
  ProjectListComponent,
  SampleListComponent,
  SessionListComponent,
  DataFilesListComponent,
  SampleAddList,
  PublicationAddList,
  ResearcherAddList,
};
