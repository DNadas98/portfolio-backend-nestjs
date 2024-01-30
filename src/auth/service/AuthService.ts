import { Injectable } from "@nestjs/common";
import { IPasswordEncoder } from "./IPasswordEncoder";
import { RegisterRequestDto } from "../dto/RegisterRequestDto";
import { UserResponsePrivateDto } from "../../users/dto/UserResponsePrivateDto";
import { LoginResponseDto } from "../dto/LoginResponseDto";
import { DatabaseService } from "../../database/service/DatabaseService";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UniqueConstraintError } from "../../common/error/UniqueConstraintError";
import { LoginRequestDto } from "../dto/LoginRequestDto";
import { InvalidCredentialsError } from "../error/InvalidCredentialsError";
import { AccountDeactivatedError } from "../error/AccountDeactivatedError";
import { AccountNotEnabledError } from "../error/AccountNotEnabledError";
import { IJwtService } from "./IJwtService";
import { JwtPayloadDto } from "../dto/JwtPayloadDto";

@Injectable()
export class AuthService {
  private readonly prisma: DatabaseService;
  private readonly passwordEncoder: IPasswordEncoder;
  private readonly jwtService: IJwtService;

  constructor(
    databaseService: DatabaseService,
    passwordEncoder: IPasswordEncoder,
    jwtService: IJwtService
  ) {
    this.prisma = databaseService;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  async register(
    registerRequestDto: RegisterRequestDto,
    enabled: boolean
  ): Promise<UserResponsePrivateDto> {
    try {
      const hashedPassword = await this.passwordEncoder.hash(
        registerRequestDto.password
      );
      const created = await this.prisma.user.create({
        data: {
          username: registerRequestDto.username,
          email: registerRequestDto.email,
          password: hashedPassword,
          enabled: enabled
        }
      });
      return new UserResponsePrivateDto(
        created.id,
        created.createdAt,
        created.updatedAt,
        created.email,
        created.username,
        created.role,
        created.enabled,
        created.active
      );
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
        throw new UniqueConstraintError(
          "User account with the provided e-mail address already exists"
        );
      }
      throw e;
    }
  }

  async login(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginRequestDto.email
      }
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const passwordsMatch = await this.passwordEncoder.compare(
      loginRequestDto.password,
      user.password
    );
    if (!passwordsMatch) {
      throw new InvalidCredentialsError();
    }
    if (!user.active) {
      throw new AccountDeactivatedError();
    }
    if (!user.enabled) {
      throw new AccountNotEnabledError();
    }
    const userDto = new UserResponsePrivateDto(
      user.id,
      user.createdAt,
      user.updatedAt,
      user.email,
      user.username,
      user.role,
      user.enabled,
      user.active
    );

    const bearerToken = await this.jwtService.signBearerToken(
      new JwtPayloadDto(user.email)
    );
    const refreshToken = await this.jwtService.signRefreshToken(
      new JwtPayloadDto(user.email)
    );

    return new LoginResponseDto(userDto, bearerToken, refreshToken);
  }

  async refresh(refreshToken: string): Promise<string> {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { email: payload.email }
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (!user.active) {
      throw new AccountDeactivatedError();
    }
    if (!user.enabled) {
      throw new AccountNotEnabledError();
    }

    const newPayload = new JwtPayloadDto(payload.email);
    return this.jwtService.signBearerToken(newPayload);
  }
}
