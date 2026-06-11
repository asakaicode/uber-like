import { GraphQLScalarType, Kind } from "graphql";
import type { Resolvers } from "../generated/resolver-types.js";

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    throw new Error("DateTime must be a Date");
  },
  parseValue(value) {
    return new Date(value as string);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

export const scalarsResolvers: Partial<Resolvers> = {
  DateTime: DateTimeScalar,
};
