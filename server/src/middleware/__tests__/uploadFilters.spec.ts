import { ALLOWED_IMAGE_MIMES, imageFileFilter } from "../uploadMiddleware";
import { documentFileFilter } from "../documentUploadMiddleware";
import { ValidationError } from "../../utils/ApiError";

const file = (mimetype: string) => ({ mimetype }) as Express.Multer.File;

describe("imageFileFilter", () => {
  it.each([...ALLOWED_IMAGE_MIMES])("accepts %s", (mime) => {
    const cb = jest.fn();
    imageFileFilter({} as never, file(mime), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it.each(["image/svg+xml", "application/pdf", "text/html", "image/x-icon"])("rejects %s with a 400 ValidationError", (mime) => {
    const cb = jest.fn();
    imageFileFilter({} as never, file(mime), cb);
    const error = cb.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
  });
});

describe("documentFileFilter", () => {
  it.each(["application/pdf", "text/plain"])("accepts %s", (mime) => {
    const cb = jest.fn();
    documentFileFilter({} as never, file(mime), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it.each(["application/msword", "text/html", "image/png"])("rejects %s", (mime) => {
    const cb = jest.fn();
    documentFileFilter({} as never, file(mime), cb);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(ValidationError);
  });
});
