import { Component, Prop, h, Listen, State, Watch } from '@stencil/core';
import { Annotations, DataStream as SynchroChartsDataStream, Threshold } from '@synchro-charts/core';
import {
  StyleSettingsMap,
  TimeSeriesDataRequestSettings,
  TimeQuery,
  Viewport,
  TimeSeriesData,
  TimeSeriesDataRequest,
  ProviderWithViewport,
  combineProviders,
  AudioAlertPlayer,
  AudioAlert,
} from '@iot-app-kit/core';
import { v4 as uuidv4 } from 'uuid';

@Component({
  tag: 'iot-scatter-chart',
  shadow: false,
})
export class IotScatterChart {
  @Prop() annotations: Annotations;

  @Prop() queries!: TimeQuery<TimeSeriesData[], TimeSeriesDataRequest>[];

  @Prop() viewport!: Viewport;

  @Prop() settings: TimeSeriesDataRequestSettings = {};

  @Prop() widgetId: string = uuidv4();

  @Prop() isEditing: boolean | undefined;

  @Prop() styleSettings: StyleSettingsMap | undefined;

  @Prop() audioAlertPlayer: AudioAlertPlayer | undefined;

  @Prop() audioAlerts: Map<Threshold | string, AudioAlert> | undefined;

  @State() provider: ProviderWithViewport<TimeSeriesData[]>;

  private defaultSettings: TimeSeriesDataRequestSettings = {
    fetchFromStartToEnd: true,
  };

  buildProvider() {
    this.provider = combineProviders(
      this.queries.map((query) =>
        query.build(this.widgetId, {
          viewport: this.viewport,
          settings: {
            ...this.defaultSettings,
            ...this.settings,
          },
        })
      )
    );
  }

  componentWillLoad() {
    this.buildProvider();
  }

  @Watch('queries')
  @Watch('settings')
  @Watch('viewport')
  private onPropUpdate() {
    this.provider.unsubscribe();
    this.buildProvider();
  }

  @Listen('dateRangeChange')
  private handleDateRangeChange({ detail: [start, end, lastUpdatedBy] }: { detail: [Date, Date, string | undefined] }) {
    this.provider.updateViewport({ start, end, lastUpdatedBy });
  }

  render() {
    return (
      <iot-time-series-connector
        annotations={this.annotations}
        provider={this.provider}
        styleSettings={this.styleSettings}
        assignDefaultColors
        audioAlertPlayer={this.audioAlertPlayer}
        audioAlerts={this.audioAlerts}
        renderFunc={({ dataStreams }) => {
          return (
            <sc-scatter-chart
              dataStreams={dataStreams as SynchroChartsDataStream[]}
              annotations={this.annotations}
              viewport={this.viewport}
              isEditing={this.isEditing}
              widgetId={this.widgetId}
            />
          );
        }}
      />
    );
  }
}
