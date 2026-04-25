import { Request, Response } from "express";
import { Product } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productData = req.body;

    const requiredFields = [
      "productName",
      "category",
      "group",
      "units",
      "billingRatePerUnit",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully.",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    throw error;
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    sendSuccess(res, products, products.length ? "" : "No products found.");
  } catch (error) {
    console.error("Get All Products Error:", error);
    throw error;
  }
};

export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No products found.");
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    throw error;
  }
};
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No products found.");
    }

    res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    throw error;
  }
};
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No products found.");
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Delete Product Error:", error);
    throw error;
  }
};
