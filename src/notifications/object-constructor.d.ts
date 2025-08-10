declare type TypedPropertyDescriptorMap<T extends object> = {
	[K in keyof T]: TypedPropertyDescriptor<T[K]>;
};

declare interface ObjectConstructor {
	create<P extends object | null>(proto: P): null extends P ? {} : P;

	create<P extends object | null, M extends object>(
		proto: P,
		properties: TypedPropertyDescriptorMap<M> & ThisType<any>,
	): null extends P ? {} & M : P & M;
}
