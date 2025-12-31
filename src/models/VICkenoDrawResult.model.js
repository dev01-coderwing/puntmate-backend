import mongoose from "mongoose";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const KenoResultSchema = new mongoose.Schema({
  draw: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  numbers: [{ type: Number, required: true }],
  location: { type: String, default: "VIC", required: true },
  createdAt: { type: Date, default: Date.now },
});

const KenoResult = mongoose.model("VICDrawNumber", KenoResultSchema);

export default KenoResult;
