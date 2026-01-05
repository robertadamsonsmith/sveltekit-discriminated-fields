# sveltekit-discriminated-fields

Type-safe discriminated union support for SvelteKit remote function form fields.

This library provides two complementary tools for working with discriminated unions in SvelteKit forms:

- **`discriminated()`** - A wrapper function that enables proper TypeScript type narrowing on form field objects
- **`FieldVariants`** - A component that renders variant-specific form sections with CSS-only visibility, supporting progressive enhancement (works without JavaScript)

The implementation prioritises:

- **Static type safety** - Catch errors at compile time with clear error messages
- **Progressive enhancement** - Forms work identically with or without JavaScript
- **Minimal boilerplate** - Simple API that stays out of your way
- **Flexibility** - Use as much or as little as you need

This library exposes existing SvelteKit form behaviour with improved typing for discriminated unions. Runtime overhead is minimal - just a thin proxy wrapper.

## Installation

```bash
npm install sveltekit-discriminated-fields
```

## FieldVariants Component

The `FieldVariants` component provides declarative variant rendering with **full progressive enhancement support**. It uses CSS-only visibility toggling via `form:has()` selectors, so forms work identically with or without JavaScript enabled.

Given a SvelteKit remote function using Zod (this library also works with [Valibot](./test/src/routes/valibot-form) or other validation libraries):

```typescript
// data.remote.ts
import { z } from "zod";
import { form } from "$app/server";

const shapeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("circle"), radius: z.number() }),
  z.object({
    kind: z.literal("rectangle"),
    width: z.number(),
    height: z.number(),
  }),
  z.object({ kind: z.literal("point") }),
]);

export const shapeForm = form(shapeSchema, async (data) => {
  // handle submission
});
```

Use `FieldVariants` to render variant-specific fields:

```svelte
<script lang="ts">
  import { shapeForm } from './data.remote';
  import { FieldVariants } from 'sveltekit-discriminated-fields';
</script>

<form {...shapeForm}>
  <select {...shapeForm.fields.kind.as('select')}>
    <option value="">Select a shape...</option>
    <option value="circle">Circle</option>
    <option value="rectangle">Rectangle</option>
    <option value="point">Point</option>
  </select>

  <FieldVariants fields={shapeForm.fields} key="kind">
    {#snippet fallback(props)}
      <p {...props}>Please select a shape type above.</p>
    {/snippet}

    {#snippet circle(shape)}
      <label {...shape}>
        Radius: <input {...shape.fields.radius.as('number')} />
      </label>
    {/snippet}

    {#snippet rectangle(shape)}
      <div {...shape}>
        <input {...shape.fields.width.as('number')} placeholder="Width" />
        <input {...shape.fields.height.as('number')} placeholder="Height" />
      </div>
    {/snippet}

    {#snippet point(shape)}
      <p {...shape}>Point has no additional fields.</p>
    {/snippet}
  </FieldVariants>

  <button type="submit">Submit</button>
</form>
```

### Snippet Parameters

Each variant snippet receives a single argument that mirrors how forms work in SvelteKit:

- **Spread for CSS targeting**: `{...shape}` - Adds the `data-fv` attribute for CSS visibility
- **Access fields**: `shape.fields.radius` - Provides the variant-specific form fields

This pattern is consistent with how you use forms: `<form {...form}>` + `form.fields.x`.

### Snippets and Fields

Each snippet receives correctly narrowed fields for that variant - TypeScript knows `shape.fields.radius` exists in the `circle` snippet but not in `rectangle`. Only valid discriminator values are accepted.

Snippets only receive fields **specific to that variant**. Fields common to all variants (same name and type) should be rendered outside `FieldVariants` to prevent accidental duplicate inputs. Fields shared by some but not all variants, or with differing types across variants, produce compile-time errors.

### Radio Buttons

For radio button discriminators, you must use the `discriminated()` wrapper. The raw SvelteKit field object's `.as("radio", value)` method doesn't work with discriminated unions (causes a static error). The wrapped version is type-safe - only valid discriminator values are accepted:

```svelte
<script lang="ts">
  import { shapeForm } from './data.remote';
  import { discriminated, FieldVariants } from 'sveltekit-discriminated-fields';

  const shape = $derived(discriminated(shapeForm.fields, 'kind'));
</script>

<form {...shapeForm}>
  <fieldset>
    <label><input {...shape.fields.kind.as("radio", "circle")} /> Circle</label>
    <label><input {...shape.fields.kind.as("radio", "rectangle")} /> Rectangle</label>
    <label><input {...shape.fields.kind.as("radio", "point")} /> Point</label>
  </fieldset>

  <FieldVariants fields={shapeForm.fields} key="kind">
    {#snippet fallback(props)}
      <p {...props}>Select a shape type</p>
    {/snippet}

    {#snippet circle(shape)}
      <label {...shape}>
        Radius: <input {...shape.fields.radius.as('number')} />
      </label>
    {/snippet}

    <!-- other snippets -->
  </FieldVariants>
</form>
```

See the [radio-form example](./test/src/routes/radio-form) for a complete working example.

### Select Options

For select elements, you can use `.as("option", value)` for type-safe option values. This is optional - you can still use `value="..."` directly if you prefer:

```svelte
<select {...shape.fields.kind.as("select")}>
  <!-- Type-safe: typos caught at compile time -->
  <option {...shape.fields.kind.as("option")}>Select a shape...</option>
  <option {...shape.fields.kind.as("option", "circle")}>Circle</option>
  <option {...shape.fields.kind.as("option", "rectangle")}>Rectangle</option>

  <!-- Also works: standard HTML (no type checking) -->
  <option value="point">Point</option>
</select>
```

- `as("option")` returns `{ value: "" }` for the placeholder option
- `as("option", "circle")` returns `{ value: "circle" }` with type checking

### CSS-Based Visibility

`FieldVariants` uses `form:has()` CSS selectors to show/hide variant sections based on the selected discriminator value. This works automatically for any layout - the discriminator input and variant sections can be anywhere within the same `<form>`.

```svelte
<form {...shapeForm}>
  <div class="header">
    <select {...shapeForm.fields.kind.as('select')}>
      <!-- options -->
    </select>
  </div>

  <div class="body">
    <!-- Works regardless of DOM structure -->
    <FieldVariants fields={shapeForm.fields} key="kind">
      <!-- snippets -->
    </FieldVariants>
  </div>
</form>
```

See the [selector-form example](./test/src/routes/selector-form) for select elements or [selector-radio-form example](./test/src/routes/selector-radio-form) for radio buttons.

### Nested and Multiple Unions

The discriminated union doesn't need to be the top-level schema. It can be nested within a larger object:

```typescript
const orderSchema = z.object({
  orderId: z.string(),
  shipping: z.discriminatedUnion("method", [
    z.object({ method: z.literal("pickup"), store: z.string() }),
    z.object({ method: z.literal("delivery"), address: z.string() }),
  ]),
});
```

```svelte
<script lang="ts">
  import { discriminated, FieldVariants } from 'sveltekit-discriminated-fields';

  const shipping = $derived(discriminated(orderForm.fields.shipping, 'method'));
</script>

<FieldVariants fields={orderForm.fields.shipping} key="method">
  {#snippet pickup(shipping)}
    <input {...shipping} {...shipping.fields.store.as('text')} />
  {/snippet}

  {#snippet delivery(shipping)}
    <input {...shipping} {...shipping.fields.address.as('text')} />
  {/snippet}
</FieldVariants>
```

You can also have multiple discriminated unions in the same form, or even a discriminated union nested within another discriminated union. See the [nested-form example](./test/src/routes/nested-form) for nested unions within objects, or [nested-union-form example](./test/src/routes/nested-union-form) for a union inside a union.

### Partial Variants

By default, `FieldVariants` requires a snippet for every variant - a compile error appears if one is missing, helping you avoid omissions. When you intentionally want to handle only some variants, use `partial={true}`:

```svelte
<FieldVariants fields={shapeForm.fields} key="kind" partial={true}>
  {#snippet circle(shape)}
    <input {...shape} {...shape.fields.radius.as('number')} />
  {/snippet}

  {#snippet rectangle(shape)}
    <input {...shape} {...shape.fields.width.as('number')} />
  {/snippet}

  <!-- point snippet omitted - nothing shown when point selected -->
</FieldVariants>
```

### Progressive Enhancement

`FieldVariants` provides true progressive enhancement:

1. **Before JavaScript loads**: All variant snippets are rendered, CSS handles visibility
2. **After JavaScript hydrates**: Switches to conditional rendering, enabling Svelte transitions

This means forms work without JavaScript, but once JS loads, you get full Svelte features:

```svelte
<FieldVariants fields={shapeForm.fields} key="kind">
  {#snippet circle(shape)}
    <!-- Svelte transitions work after hydration -->
    <div {...shape} transition:slide>
      <input {...shape.fields.radius.as('number')} />
    </div>
  {/snippet}
</FieldVariants>
```

### Disabling CSS

If you want to handle visibility yourself, disable CSS generation:

```svelte
<FieldVariants fields={shapeForm.fields} key="kind" css={false}>
  <!-- snippets -->
</FieldVariants>
```

## discriminated Function

When using SvelteKit's remote function `form()` with discriminated union schemas, the generated `fields` object is a union of field objects. TypeScript only allows access to properties that exist on ALL variants - meaning variant-specific fields are inaccessible, and `.as("radio", value)` doesn't work.

The `discriminated()` function wraps your form fields to:

1. Provide `.type` - the current discriminator value for TypeScript narrowing
2. Provide `.fields` - all variant fields accessible with proper typing
3. Provide a type-safe `.set()` method for programmatic updates
4. Fix `.as("radio", value)` to accept only valid discriminator values

The following example demonstrates conditionally rendering variant-specific fields with type-safe narrowing, without using `FieldVariants`. This approach requires JavaScript (unlike `FieldVariants` which works without JS):

```svelte
<script lang="ts">
  import { shapeForm } from './data.remote';
  import { discriminated } from 'sveltekit-discriminated-fields';

  const shape = $derived(discriminated(shapeForm.fields, 'kind'));
</script>

<!-- Use .type for narrowing, .fields for field access -->
{#if shape.type === 'circle'}
  <input {...shape.fields.radius.as('number')} /> <!-- TypeScript knows radius exists -->
{:else if shape.type === 'rectangle'}
  <input {...shape.fields.width.as('number')} />  <!-- TypeScript knows width exists -->
  <input {...shape.fields.height.as('number')} />
{/if}
```

See the [programmatic-form example](./test/src/routes/programmatic-form) for usage of `set()` and other programmatic features.

## API

### `FieldVariants`

A component for rendering variant-specific form sections with CSS-only visibility.

**Props:**

| Prop      | Type                 | Description                                               |
| --------- | -------------------- | --------------------------------------------------------- |
| `fields`  | `RemoteFormFields`   | Raw form fields from `form.fields` (not wrapped)          |
| `key`     | `string`             | The discriminator key (must match a field in the schema)  |
| `partial` | `boolean` (optional) | Allow missing snippets for some variants (default: false) |
| `css`     | `boolean` (optional) | Enable CSS visibility generation (default: true)          |

**Snippets:**

- `fallback(props)` - Rendered when no variant is selected. Spread `props` onto your element.
- `{variantName}(variant)` - One snippet per variant. Spread `variant` onto your container, access fields via `variant.fields`.

### `discriminated(fields, key)`

Wraps discriminated union form fields for type-safe narrowing.

**Parameters:**

- `fields` - Form fields from a discriminated union schema
- `key` - The discriminator key (must exist as a field in all variants)

**Returns:** A proxy object with:

- `type` - The current discriminator value (for narrowing)
- `fields` - All form fields with proper variant typing
- `set(data)` - Type-safe setter that infers variant from discriminator
- `allIssues()` - All validation issues for the discriminated fields

### `DiscriminatedData<T>`

Type helper that extracts the underlying data type from wrapped fields:

```typescript
const payment = discriminated(form.fields, "type");
type Payment = DiscriminatedData<typeof payment>;
// { type: 'card'; cardNumber: string; cvv: string } | { type: 'bank'; ... }
```

### `VariantSnippetArg<T>`

Type for the argument passed to variant snippets:

```typescript
// variant can be spread onto elements and has a .fields property
type VariantSnippetArg<T> = VariantProps & { readonly fields: T };
```

## License

MIT
