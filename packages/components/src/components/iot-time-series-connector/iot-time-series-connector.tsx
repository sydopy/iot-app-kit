import { Component, Prop, State, Watch } from '@stencil/core';
import {
  Provider,
  StyleSettingsMap,
  TimeSeriesData,
  Viewport,
  playThresholdAudioAlert,
  AudioAlert,
} from '@iot-app-kit/core';
import { bindStylesToDataStreams } from '../common/bindStylesToDataStreams';
import { Annotations, Threshold } from '@synchro-charts/core';

const DEFAULT_VIEWPORT = { duration: 10 * 1000 * 60 }; // ten minutes

const combineTimeSeriesData = (timeSeresDataResults: TimeSeriesData[]): TimeSeriesData =>
  timeSeresDataResults.reduce(
    (timeSeriesData, { dataStreams, viewport }) => ({
      dataStreams: [...timeSeriesData.dataStreams, ...dataStreams],
      viewport,
    }),
    { dataStreams: [], viewport: { duration: 0 } }
  );

@Component({
  tag: 'iot-time-series-connector',
  shadow: false,
})
export class IotTimeSeriesConnector {
  @Prop() annotations: Annotations;

  @Prop() provider: Provider<TimeSeriesData[]>;

  @Prop() renderFunc: (data: TimeSeriesData) => void;

  @Prop() initialViewport: Viewport;

  @Prop() styleSettings: StyleSettingsMap | undefined;

  @Prop() assignDefaultColors: boolean | undefined;

  @Prop() audioAlertsEnabled = false;

  @State() data: TimeSeriesData = {
    dataStreams: [],
    viewport: DEFAULT_VIEWPORT,
  };

  audioAlerts: Map<Threshold | string, AudioAlert> | undefined;

  componentWillLoad() {
    this.provider.subscribe({
      next: (results: TimeSeriesData[]) => {
        if (this.audioAlertsEnabled) {
          playThresholdAudioAlert({
            dataStreams: this.data.dataStreams,
            viewport: this.data.viewport,
            annotations: this.annotations,
            audioAlerts: this.audioAlerts,
          });
        }
        this.data = combineTimeSeriesData(results);
      },
    });
  }

  @Watch('provider')
  private onProviderUpdate() {
    this.provider.unsubscribe();

    this.provider.subscribe({
      next: (results: TimeSeriesData[]) => {
        this.data = combineTimeSeriesData(results);
      },
    });
  }

  componentDidUnmount() {
    this.provider.unsubscribe();
  }

  render() {
    const {
      data: { dataStreams, viewport },
    } = this;

    return this.renderFunc({
      dataStreams: bindStylesToDataStreams({
        dataStreams,
        styleSettings: this.styleSettings,
        assignDefaultColors: this.assignDefaultColors || false,
      }),
      viewport,
    });
  }
}
