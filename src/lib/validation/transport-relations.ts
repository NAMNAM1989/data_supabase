import { z } from "zod";

export const assignDriverVehicleSchema = z.object({
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  is_preferred: z.boolean().default(false),
  valid_from: z.string().trim().optional().or(z.literal("")),
  valid_to: z.string().trim().optional().or(z.literal("")),
});

export const linkCustomerDriverSchema = z.object({
  customer_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  is_default: z.boolean().default(false),
});

export const linkCustomerVehicleSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  is_default: z.boolean().default(false),
});

export type AssignDriverVehicleInput = z.infer<typeof assignDriverVehicleSchema>;
export type LinkCustomerDriverInput = z.infer<typeof linkCustomerDriverSchema>;
export type LinkCustomerVehicleInput = z.infer<typeof linkCustomerVehicleSchema>;

export const updateDriverVehicleSchema = z.object({
  relation_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  is_preferred: z.boolean().default(false),
});

export const updateCustomerDriverSchema = z.object({
  relation_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  is_default: z.boolean().default(false),
});

export const updateCustomerVehicleSchema = z.object({
  relation_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  is_default: z.boolean().default(false),
});

export type UpdateDriverVehicleInput = z.infer<typeof updateDriverVehicleSchema>;
export type UpdateCustomerDriverInput = z.infer<typeof updateCustomerDriverSchema>;
export type UpdateCustomerVehicleInput = z.infer<typeof updateCustomerVehicleSchema>;
