import { Request, Response } from "express";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { userModel } from "../models/user";
import { response, serverError } from "../helpers/response";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const signUp = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  try {
    let user: any;
    user = await userModel.findOne({ email: body.email });
    if (user) return response(res, true, 400, "User already exists", null);
    user = await userModel.create(body);
    if (!user) response(res, true, 400, "User not found", null);

    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.name
    });
    if (stripeCustomer) {
      user = await userModel.findOneAndUpdate({ _id: new ObjectId(user._id) }, { customerId: stripeCustomer.id }, { new: true });
    }
    console.log("stripeCustomer=>", stripeCustomer)
    return response(res, false, 201, "User created successfully..", user);
  } catch (error) {
    serverError(res, error);
  }
};

export const signIn = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;
  try {
    const user = await userModel.findOne({ email: body.email, isActive: true, isDelete: false });
    if (!user) return response(res, true, 400, "User not found", null);

    const isPasswordMatch = await compare(body.password, user.password);
    if (!isPasswordMatch) return response(res, true, 400, "Invalid password", null);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("token=>", token)
    if (!token) return response(res, true, 400, "Failed to generate token", null);

    return response(res, false, 200, "Login successful", { token });
  } catch (error) {
    serverError(res, error);
  }
};