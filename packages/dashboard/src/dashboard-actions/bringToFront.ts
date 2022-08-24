import { DashboardConfiguration } from '../types';
import { mapWidgets } from '../util/dashboardConfiguration';
import { isDefined } from '../util/isDefined';

/**
 * Returns a dashboard with the provided widget id's all with their z-index such that these widgets will display above all other widget on the dashboard.
 *
 * This method retains the relative z-index order of the widgets requested to bring to back.
 */
export const bringToFront = ({
  dashboardConfiguration,
  widgetIds,
}: {
  dashboardConfiguration: DashboardConfiguration;
  widgetIds: string[];
}): DashboardConfiguration => {
  const topZIndex = Math.max(...dashboardConfiguration.widgets.map(({ z }) => z));
  const minSelectedZ = Math.min(
    ...widgetIds
      .map((widgetId) => dashboardConfiguration.widgets.find(({ id }) => id === widgetId))
      .filter(isDefined)
      .map(({ z }) => z)
  );

  const zOffset = topZIndex + 1 - minSelectedZ;
  return mapWidgets(dashboardConfiguration, (widget) => {
    if (widgetIds.includes(widget.id)) {
      return {
        ...widget,
        z: widget.z + zOffset,
      };
    }
    return widget;
  });
};