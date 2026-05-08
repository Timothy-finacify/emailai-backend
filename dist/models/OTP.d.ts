declare const _exports: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    code: string;
    purpose: "verification" | "password-reset";
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    code: string;
    purpose: "verification" | "password-reset";
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    code: string;
    purpose: "verification" | "password-reset";
    expiresAt: Date;
    attempts: number;
    verified: boolean;
} & {
    _id: mongoose.Types.ObjectId;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    code: string;
    purpose: "verification" | "password-reset";
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    code: string;
    purpose: "verification" | "password-reset";
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    code: string;
    purpose: "verification" | "password-reset";
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}> & {
    _id: mongoose.Types.ObjectId;
}>>;
export = _exports;
import mongoose = require("mongoose");
