# Loops Campaign API

> [!WARNING]
> This is a work in progress. That being said, feel free to email me: mahad@hackclub.com if you've got any queries or issues!

A work-in-progress API to programmatically send Loops campaigns using MJML. Not affiliated with Loops.

## Getting started

### Getting your session token

You'll need to get the `__Secure-next-auth.session-token` cookie from your browser when logged in to Loops.

### Sending your first campaign

Let's get started!

First, install the package:

```
npm install loops-campaign-api
```

Note that the package supports ESM only. Now it's time for the fun part: actually sending out a campaign!

```ts
import LoopsClient from "loops-campaign-api";

const loops = new LoopsClient(sessionToken); // The cookie value obtained from the previous step

const campaignId = await loopsClient.createAndSendCampaign({
	// An emoji to identify this campaign in the Loops dashboard.
	emoji: "📰",
	// The name of the campaign. This will be displayed in the Loops dashboard.
	name: `Archimedes: ${subject}`,
	// The subject of the campaign. This will be used as the subject line of the campaign, and will be shown to recipients.
	subject,
	// The zip file containing the campaign content. Should be a File object, and must have an `index.mjml` file, as well as any images it references.
	zipFile: file,
	// The audience filter to target. Copy this from DevTools (TODO: improve docs for this)
	// Set to `null` to send to all users in your audience
	audienceFilter: campaignAudienceFilter,
	// The audience segment to target. This can be a number or a string.
	// Set to `null` to send to all users in your audience
	audienceSegmentId: campaignAudienceSegmentId,
	// The name of the sender of the campaign. This will be used as the from name in the campaign.
	fromName: "Foo Team",
	// The email address **username** of the sender of the campaign. This will be used as the from email in the campaign.
	// For instance, if your Loops domain is `foo.com`, set this to `alex` to use `alex@foo.com`
	fromEmailUsername: "alex",
	// The email address of the reply-to of the campaign. if someone replies to the campaign, this will be the address they reply to.
	replyToEmail: "team@foo.com"
});
```

And that's it! You've successfully sent your first campaign!

## Getting support

First off, I know these docs aren't great. My apologies! This is mostly an internal library, and I'm still working on making it more user-friendly.

With that being said, if you have any questions or issues, feel free to open a GitHub issue! I'll look at it as soon as I can.

---

&copy; 2025 Mahad Kalam