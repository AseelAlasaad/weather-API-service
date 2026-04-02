import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Query,
  ServiceUnavailableException,
  HttpException,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { WeatherService } from './weather.service';
import { GetWeatherDto } from './dto/weather.dto';
import {
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InvalidWeatherQueryException, AllProvidersFailedException } from './errors/error-service';
@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

   //Health check endpoint
  @Get('health')
  @ApiOkResponse({ description: 'Service is running.' })
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @UseGuards(ThrottlerGuard)
  @Get()
  @ApiOkResponse({ description: 'Current weather data successfully retrieved.' })
  @ApiBadRequestResponse({
    description: 'Invalid query: provide either city OR lat+lon.',
  })
  @ApiServiceUnavailableResponse({ description: 'All weather providers failed.' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'City name' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lon', required: false, type: Number, description: 'Longitude' })
  async getWeather(
    @Query(new ValidationPipe({ transform: true })) query: GetWeatherDto,
  ) {
    try {
      return await this.weatherService.getWeather(query);
    } catch (error) {
      if (error instanceof InvalidWeatherQueryException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof HttpException && error.getStatus() === 404) {
        throw new NotFoundException(error.message);
      }
       if (error instanceof AllProvidersFailedException) {
      throw new ServiceUnavailableException(`All providers failed. Error ID: ${error.errorId}`);
    }
      throw new InternalServerErrorException(
        'An unexpected error occurred. Please try again later.',
      );
    }
  }
}