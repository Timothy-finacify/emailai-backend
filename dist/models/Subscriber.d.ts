declare const _exports: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    name: string;
    clicks: number;
    email: string;
    phone: string;
    isActive: boolean;
    campaignId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    source: "direct" | "share_link" | "import" | "api";
    lastClicked: Date;
    unsubscribedAt: Date;
    unsubscribeReason: string;
    subscribedAt: Date;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    name: string;
    clicks: number;
    email: string;
    phone: string;
    isActive: boolean;
    campaignId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    source: "direct" | "share_link" | "import" | "api";
    lastClicked: Date;
    unsubscribedAt: Date;
    unsubscribeReason: string;
    subscribedAt: Date;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    name: string;
    clicks: number;
    email: string;
    phone: string;
    isActive: boolean;
    campaignId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    source: "direct" | "share_link" | "import" | "api";
    lastClicked: Date;
    unsubscribedAt: Date;
    unsubscribeReason: string;
    subscribedAt: Date;
} & {
    _id: mongoose.Types.ObjectId;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    name: string;
    clicks: number;
    email: string;
    phone: string;
    isActive: boolean;
    campaignId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    source: "direct" | "share_link" | "import" | "api";
    lastClicked: Date;
    unsubscribedAt: Date;
    unsubscribeReason: string;
    subscribedAt: Date;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    name: string;
    clicks: number;
    email: string;
    phone: string;
    isActive: boolean;
    campaignId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    source: "direct" | "share_link" | "import" | "api";
    lastClicked: Date;
    unsubscribedAt: Date;
    unsubscribeReason: string;
    subscribedAt: Date;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    name: string;
    clicks: number;
    email: string;
    phone: string;
    isActive: boolean;
    campaignId: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent: string;
    source: "direct" | "share_link" | "import" | "api";
    lastClicked: Date;
    unsubscribedAt: Date;
    unsubscribeReason: string;
    subscribedAt: Date;
}> & {
    _id: mongoose.Types.ObjectId;
}>>;
export = _exports;
import mongoose = require("mongoose");
