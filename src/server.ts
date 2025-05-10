import * as bodyParser from "body-parser";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { mongooseConnection } from "./database/db";
import { webhook } from "./controllers/stripe"; // Import webhook directly
import { authRouter } from "./routes/auth";
import { stripeRouter } from "./routes/stripe";

mongooseConnection;
dotenv.config();
const app = express();
const port = process.env.PORT || 3033;

// Apply webhook BEFORE body parsers
app.post("/webhook", express.raw({ type: "application/json" }), webhook);

app.use(cors());
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.get('/checkout', (req, res) => {
  res.render('checkout'); 
});

app.get("/", (req: Request, res: Response) => {
  res.send("Stripe working properly.");
});

app.use("/auth", authRouter);
app.use("/stripe", stripeRouter);

// app.use("*", bad_gateway);

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
