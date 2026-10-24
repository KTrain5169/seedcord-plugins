export function fn() {
  return "Hello, tsdown!";
}

import { NodeSDK, type NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from "@opentelemetry/sdk-metrics";
import type { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { SimpleLogRecordProcessor, ConsoleLogRecordExporter } from "@opentelemetry/sdk-logs";
import defu from "defu";

import { otelOverrideOf, hasOverrideOTel } from "./decorators/OverrideOTel";
import type { OpenTelemetryPluginOptions } from "./decorators/OverrideOTel";

export {
  OverrideOTel,
  OverrideOTelMetadataKey,
  OTelOverrideMetadataKey,
  OpenTelemetryOverrideMetadataKey,
  otelOverrideOf,
  overrideOTelOf,
  getOTelOverride,
  getOverrideOTel,
  OverrideOTelOf,
  hasOverrideOTel
} from "./decorators/OverrideOTel";
export type { OpenTelemetryPluginOptions } from "./decorators/OverrideOTel";

export type OpenTelemetryOptions = OpenTelemetryPluginOptions;

export class OpenTelemetry extends Plugin<{ runtime: "server"; transport: "any" }> {
  private otel?: NodeSDK;

  constructor(
    host: CoreBase,
    private readonly options?: OpenTelemetryOptions
  ) {
    super(host);
  }

  async init(): Promise<void> {
    const defOpts = defu<Partial<NodeSDKConfiguration>, Partial<NodeSDKConfiguration>[]>(
      this.options?.sdkConfig,
      {
        traceExporter: new ConsoleSpanExporter(),
        metricReader: new PeriodicExportingMetricReader({
          exporter: new ConsoleMetricExporter(),
        }),
        spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
        logRecordProcessors: [
          new SimpleLogRecordProcessor({ exporter: new ConsoleLogRecordExporter() }),
        ],
        instrumentations: [new WinstonInstrumentation({})],
      }
    );
    this.otel = new NodeSDK(defOpts);
    this.otel.start();
  }

  async dispose(): Promise<void> {
    await this.otel?.shutdown();
  }

  /** Direct access to the configured NodeSDK instance once initialized. */
  get sdk(): NodeSDK | undefined {
    return this.otel;
  }

  /** Resolve any option overrides recorded for a handler class or instance. */
  static overrideFor(target: Function | object | null | undefined): OpenTelemetryPluginOptions | undefined {
    return otelOverrideOf(target);
  }

  static getOTelOverride(target: Function | object | null | undefined): OpenTelemetryPluginOptions | undefined {
    return otelOverrideOf(target);
  }

  static getOverrideOTel(target: Function | object | null | undefined): OpenTelemetryPluginOptions | undefined {
    return otelOverrideOf(target);
  }

  static hasOverride(target: Function | object | null | undefined): boolean {
    return hasOverrideOTel(target);
  }
}

export const OTel = OpenTelemetry;
export default OpenTelemetry;