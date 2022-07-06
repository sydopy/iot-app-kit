import { Component, Prop, State, Watch } from '@stencil/core';
import {
  AudioAlert,
  AudioAlertPlayer,
  DataStream,
  Provider,
  StyleSettingsMap,
  TimeSeriesData,
  Viewport,
  getDataPoints,
  getVisibleData,
  isNumberDataStream,
} from '@iot-app-kit/core';
import { bindStylesToDataStreams } from '../common/bindStylesToDataStreams';
import {
  Annotations,
  breachedThreshold,
  getThresholds,
  Threshold,
  DataStream as SynchroChartsDataStream,
  MinimalViewPortConfig,
} from '@synchro-charts/core';

const DEFAULT_VIEWPORT = { duration: 10 * 1000 * 60 }; // ten minutes
const liveDataTimeBuffer = 1500;

const combineTimeSeriesData = (timeSeresDataResults: TimeSeriesData[]): TimeSeriesData =>
  timeSeresDataResults.reduce(
    (timeSeriesData, { dataStreams, viewport }) => ({
      dataStreams: [...timeSeriesData.dataStreams, ...dataStreams],
      viewport,
    }),
    { dataStreams: [], viewport: { duration: 0 } }
  );

const isLiveData = (viewport: MinimalViewPortConfig): boolean => {
  if ('duration' in viewport) {
    return true;
  } else {
    const endTimestamp = typeof viewport.end === 'string' ? new Date(viewport.end).getTime() : viewport.end.getTime();
    return endTimestamp + liveDataTimeBuffer > Date.now();
  }
};
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

  @Prop() audioAlertPlayer: AudioAlertPlayer | undefined;

  @Prop() viewport: MinimalViewPortConfig;

  @State() data: TimeSeriesData = {
    dataStreams: [],
    viewport: DEFAULT_VIEWPORT,
  };

  @State() audioAlerts: Map<Threshold | string, AudioAlert>;

  componentWillLoad() {
    this.provider.subscribe({
      next: (results: TimeSeriesData[]) => {
        this.playAudioAlert();
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

  private initializeAudioAlerts = (thresholds: Threshold[]) => {
    this.audioAlerts = this.audioAlerts ?? new Map<Threshold, AudioAlert>();
    thresholds.forEach((threshold) => {
      if (!this.audioAlerts.has(threshold) && this.audioAlertPlayer) {
        this.audioAlerts.set(
          threshold.id ?? threshold,
          new AudioAlert({
            audioAlertPlayer: this.audioAlertPlayer,
            isMuted: false,
            volume: 1.0,
            severity: threshold.severity,
          })
        );
      }
    });
  };

  public playAudioAlert() {
    if (!this.annotations || this.audioAlertPlayer === undefined) {
      return;
    }
    const numberStreams: DataStream[] = this.data.dataStreams.filter(isNumberDataStream);
    const thresholds = getThresholds(this.annotations);
    this.initializeAudioAlerts(thresholds);
    numberStreams.forEach((dataStream: DataStream) => {
      if (isLiveData(this.data.viewport)) {
        const allPoints = getVisibleData(getDataPoints(dataStream, dataStream.resolution), this.data.viewport);
        if (allPoints.length != 0) {
          const latestPoint = allPoints[allPoints.length - 1];
          const breachedThresh = breachedThreshold({
            value: latestPoint.y,
            date: new Date(latestPoint.x),
            thresholds: thresholds,
            dataStreams: [],
            dataStream: dataStream as SynchroChartsDataStream,
          });
          if (breachedThresh != undefined) {
            this.audioAlerts.get(breachedThresh.id ?? breachedThresh)?.play();
          }
        }
      }
    });
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
