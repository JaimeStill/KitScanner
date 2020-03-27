/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare type bit = number;
declare type byte = number;
declare type short = number;
declare type int = number;
declare type float = number;

declare type char = number;

declare type List<T>  = Array<T>;
declare type Collection<T> = Array<T>;
declare type Deque<T> = Array<T>;
