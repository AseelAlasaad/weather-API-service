export class InvalidWeatherQueryException extends Error {
  constructor() {
    super('Provide either city OR coordinates, not both or none');
    this.name = 'InvalidWeatherQueryException';
  }
}

export class AllProvidersFailedException extends Error {
  public readonly errorId: string;

  constructor(errorId: string) {
    super('All weather providers failed');
    this.name = 'AllProvidersFailedException';
    this.errorId = errorId;
  }
}