import { Response, NextFunction } from "express";
import { KnowledgeSourceType } from "@prisma/client";
import { AuthenticatedRequest } from "../types/express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, NotFoundError, ValidationError } from "../utils/ApiError";
import { persistDocumentFile } from "../services/knowledge/documentStorage";
import { extractDocumentText } from "../services/knowledge/pdfTextExtractor";
import {
  createKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  listKnowledgeBaseForAdmin,
  updateKnowledgeBaseEntry,
} from "../services/knowledge/knowledgeBaseService";

export const getAdminKnowledgeBase = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const documents = await listKnowledgeBaseForAdmin();
    res.json(
      new ApiResponse(200, { documents }, "Knowledge base documents loaded"),
    );
  },
);

export const uploadKnowledgeBaseDocument = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const file = req.file;
    if (!file) {
      return next(new ValidationError("Document file is required"));
    }

    const title =
      String(req.body?.title ?? "").trim() ||
      file.originalname.replace(/\.[^.]+$/, "");

    let content: string;
    try {
      content = await extractDocumentText(file.buffer, file.mimetype);
    } catch {
      return next(new ApiError(400, "Failed to extract text from document"));
    }

    if (!content || content.length < 10) {
      return next(
        new ValidationError(
          "Document contains too little text to use as knowledge.",
        ),
      );
    }

    const fileUrl = await persistDocumentFile(file.buffer, file.originalname);
    const sourceType =
      file.mimetype === "application/pdf"
        ? KnowledgeSourceType.PDF
        : KnowledgeSourceType.MANUAL;

    const document = await createKnowledgeBaseEntry({
      title,
      content,
      sourceType,
      fileUrl,
      fileName: file.originalname,
      isActive: req.body?.isActive !== "false",
    });

    res
      .status(201)
      .json(new ApiResponse(201, { document }, "Document uploaded and indexed"));
  },
);

export const createManualKnowledgeBase = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const body = req.validatedData as {
      title: string;
      content: string;
      isActive?: boolean;
    };

    const document = await createKnowledgeBaseEntry({
      title: body.title,
      content: body.content,
      sourceType: KnowledgeSourceType.MANUAL,
      isActive: body.isActive ?? true,
    });

    res
      .status(201)
      .json(new ApiResponse(201, { document }, "Knowledge entry created"));
  },
);

export const updateAdminKnowledgeBase = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const document = await updateKnowledgeBaseEntry(id, req.validatedData);
      res.json(new ApiResponse(200, { document }, "Knowledge entry updated"));
    } catch {
      return next(new NotFoundError("Knowledge entry not found"));
    }
  },
);

export const deleteAdminKnowledgeBase = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      await deleteKnowledgeBaseEntry(id);
      res.json(new ApiResponse(200, { id }, "Knowledge entry deleted"));
    } catch {
      return next(new NotFoundError("Knowledge entry not found"));
    }
  },
);
