import { XAnnotation } from '@synchro-charts/core';
import { DashboardConfiguration } from '../types';

export const addXAnnotation = ({
  dashboardConfiguration,
  widgetId,
  annotation,
}: {
  dashboardConfiguration: DashboardConfiguration;
  widgetId: string;
  annotation: XAnnotation;
}) => {
  return dashboardConfiguration.map((widget) => {
    if (widget.id == widgetId) {
      let currAnnotations = widget.annotations;
      if (currAnnotations && currAnnotations.x) {
        currAnnotations.x.push(annotation);
      } else if (!currAnnotations) {
        currAnnotations = {
          x: [annotation],
        };
      } else {
        currAnnotations = {
          ...currAnnotations,
          x: [annotation],
        };
      }
      return {
        ...widget,
        annotations: currAnnotations,
      };
    }
    return widget;
  });
};

export const deleteXAnnotation = ({
  dashboardConfiguration,
  widgetId,
  annotationToDelete,
}: {
  dashboardConfiguration: DashboardConfiguration;
  widgetId: string;
  annotationToDelete: XAnnotation;
}) => {
  return dashboardConfiguration.map((widget) => {
    if (widget.id == widgetId) {
      let currAnnotations = widget.annotations;
      if (currAnnotations && currAnnotations.x) {
        currAnnotations = {
          ...currAnnotations,
          x: currAnnotations.x.filter((annotation) => JSON.stringify(annotation) != JSON.stringify(annotationToDelete)),
        };
      }
      return {
        ...widget,
        annotations: currAnnotations,
      };
    }
    return widget;
  });
};

export const editXAnnotation = ({
  dashboardConfiguration,
  widgetId,
  oldAnnotation,
  newAnnotation,
}: {
  dashboardConfiguration: DashboardConfiguration;
  widgetId: string;
  oldAnnotation: XAnnotation;
  newAnnotation: XAnnotation;
}) => {
  return dashboardConfiguration.map((widget) => {
    if (widget.id == widgetId) {
      let currAnnotations = widget.annotations;
      if (currAnnotations && currAnnotations.x) {
        currAnnotations.x = currAnnotations.x.filter(
          (annotation) => JSON.stringify(annotation) != JSON.stringify(oldAnnotation)
        );
        currAnnotations.x.push(newAnnotation);
      }
      return {
        ...widget,
        annotations: currAnnotations,
      };
    }
    return widget;
  });
};
