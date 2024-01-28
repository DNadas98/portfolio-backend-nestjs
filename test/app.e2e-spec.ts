import {Test, TestingModule} from "@nestjs/testing";
import {INestApplication} from "@nestjs/common";
import {AppModule} from "./../src/app.module";

describe("App context (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  it("should initialize", async () => {
    await expect(app.init()).resolves.not.toThrow();
  });
});
