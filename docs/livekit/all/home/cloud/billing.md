LiveKit Docs › LiveKit Cloud › Billing

---

# LiveKit Cloud billing

> Guide to LiveKit Cloud invoices and billing cycles.

## Pricing

Refer to the following page for current pricing information:

- **[LiveKit Cloud pricing](https://livekit.io/pricing)**: Current pricing, limits, and quotas for LiveKit Cloud plans.

## Resource metering

All LiveKit Cloud pricing plans include usage-based pricing, metered by resource consumption. LiveKit Cloud measures usage by **time** or by **data transfer**, depending on the resource. The following table shows the metering approach for each type.

| Resource type | Unit | Minimum increment |
| Time | Minute | 1 minute |
| Data transfer | GB | 0.01 GB |

Resource usages are rounded up to the minimum increment prior to calculating total usage. For example, a connection lasting 10 seconds is billed as 1 connection minute, and one lasting 70 seconds is billed as 2 connection minutes.

For more information on each metered resource, see the [Quotas and limits](https://docs.livekit.io/home/cloud/quotas-and-limits.md#metered-resources) guide.

## Invoices

LiveKit Cloud invoices are issued at the end of each month. The invoice total is based on resource consumption and the project's selected plan. No invoice is issued for projects with no amount due.

### Downloading invoices

Past monthly invoices are available as PDFs on the project's [billing page](https://cloud.livekit.io/projects/p_/billing) for project admins. Click the **PDF** link in the **Statements** section to download the invoice.

### Invoice customization

By default, the invoice lists only your project name. Some customers require more information on the invoice, such as a billing address or VAT number. You can add this information to your invoice by selecting the more (**...**) menu to the right of the PDF link, then selecting **Customize “Invoice to:” field**.

This plain text field accepts any text, which is rendered verbatim on the invoice PDF (including newlines). For example, you can include your business name and address as in the following example:

```text
Acme Inc.
404 Nowhere Ln.
New York, NY 10001

```

After saving your changes, select the **PDF** link to re-download the invoice PDF with the new information.

---

This document was rendered at 2025-09-27T09:36:31.706Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/billing.md](https://docs.livekit.io/home/cloud/billing.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).