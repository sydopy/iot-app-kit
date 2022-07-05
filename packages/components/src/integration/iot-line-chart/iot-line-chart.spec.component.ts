import { renderChart } from '../../testing/renderChart';
import { mockGetAggregatedOrRawResponse } from '../../testing/mocks/mockGetAggregatedOrRawResponse';
import { mockGetAssetSummary } from '../../testing/mocks/mockGetAssetSummaries';
import { ScaleConfig, ScaleType } from '@synchro-charts/core';

const SECOND_IN_MS = 1000;

const snapshotOptions = {
  clip: { x: 0, y: 0, width: 400, height: 500 },
};

describe('line chart', () => {
  const assetId = 'some-asset-id';
  const assetModelId = 'some-asset-model-id';

  before(() => {
    cy.intercept('/properties/aggregates?*', (req) => {
      if (new Date(req.query.startDate).getUTCFullYear() === 1899) {
        req.reply(
          mockGetAggregatedOrRawResponse({
            startDate: new Date(new Date(req.query.endDate).getTime() - 60 * SECOND_IN_MS),
            endDate: new Date(req.query.endDate),
            resolution: req.query.resolution as string,
          })
        );
      } else {
        req.reply(
          mockGetAggregatedOrRawResponse({
            startDate: new Date(req.query.startDate),
            endDate: new Date(req.query.endDate),
            resolution: req.query.resolution as string,
          })
        );
      }
    });

    cy.intercept(`/assets/${assetId}`, (req) => {
      req.reply(mockGetAssetSummary({ assetModelId, id: assetId }));
    });
  });

  it('renders', () => {
    renderChart({ chartType: 'iot-line-chart' });

    cy.wait(SECOND_IN_MS * 2);

    cy.matchImageSnapshot(snapshotOptions);
  });

  it('renders passes all props to synchro-charts', () => {
    const props = {
      widgetId: '123',
      viewport: { duration: '5m' },
      size: { width: 10, height: 10 },
      movement: { enableXScroll: true, enableYScroll: false, zoomMax: 10, zoomMin: 0 },
      scale: {
        xScaleType: ScaleType.TimeSeries,
        yScaleType: ScaleType.TimeSeries,
        xScaleSide: 'top',
        yScaleSide: 'left',
      } as ScaleConfig,
      layout: {
        xTicksVisible: true,
        yTicksVisible: true,
        xGridVisible: true,
        yGridVisible: true,
      },
      gestures: true,
      annotations: { show: true, thresholdOptions: true, colorDataAcrossThresholds: true },
      isEditing: false,
      trends: [],
      messageOverrides: {},
      axis: { labels: { yAxis: { content: 'yAxis' } } },
    };

    renderChart({ chartType: 'iot-line-chart', ...props });

    cy.wait(SECOND_IN_MS * 2);

    cy.get('sc-line-chart').should((e) => {
      const [chart] = e.get();
      (Object.keys(props) as Array<keyof typeof props>).forEach((prop) => {
        const value = chart[prop as keyof HTMLScLineChartElement];
        const passedInValue = props[prop];
        expect(value).to.deep.equal(passedInValue);
      });
    });
  });
});
