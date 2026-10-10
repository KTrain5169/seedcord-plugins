export function fn() {
  return "Hello, tsdown!";
}

import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from "@opentelemetry/sdk-metrics";
import type { CoreBase } from "@seedcord/core";
import { Plugin } from "@seedcord/core/plugin";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { SimpleLogRecordProcessor, ConsoleLogRecordExporter } from "@opentelemetry/sdk-logs";

export class OpenTelemetry extends Plugin<{
  runtime: "server";
  transport: "any";
}> {
  private otel?: NodeSDK;

  constructor(
    host: CoreBase,
    private readonly options?: {},
  ) {
    super(host);
  }

  async init(): Promise<void> {
    this.otel = new NodeSDK({
      traceExporter: new ConsoleSpanExporter(),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
      }),
      spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
      logRecordProcessors: [
        new SimpleLogRecordProcessor({ exporter: new ConsoleLogRecordExporter() }),
      ],
      instrumentations: [new WinstonInstrumentation({})],
    });
    this.otel.start()
  }

  async dispose(): Promise<void> {
    await this.otel?.shutdown()
  }
}
