import { Filter } from 'adminjs';
import { FilterQuery, AnyEntity } from '@mikro-orm/core';
export declare function convertFilter(filter?: Filter): FilterQuery<AnyEntity>;
