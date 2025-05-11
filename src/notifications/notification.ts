export interface NotificationDetails<
	Payload extends object = Record<string, string>,
	UserData extends object = Record<string, string>,
> {
	expiration?: number;
	collapseID?: string;
	priority?: number;
	payload: Payload;
	userData?: UserData;
}
