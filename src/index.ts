interface UpdateCampaignEmojiAndName {
	/**
	 * The ID of the campaign.
	 *
	 * You can get this by calling `client.createCampaignAndReturnId()` or by listing your campaigns and finding the one you want to update.
	 */
	campaignId: string;
	/**
	 * The emoji to use for the campaign.
	 *
	 * This isn't shown to your recipients. Rather, it's used to identify the campaign among other campaigns in the Loops dashboard.
	 */
	emoji: string;
	/**
	 * The name to give the campaign.
	 */
	name: string;
}

interface UseMjml {
	/**
	 * The ID of the email message.
	 *
	 * This is used to identify the campaign that the MJML template will be used for.
	 */
	emailMessageId: string;
	/**
	 * The ZIP file containing the MJML template.
	 *
	 * The ZIP file must contain a file named `index.mjml` with the MJML template, as well as any images it references.
	 */
	zipFile: File;
}

interface UpdateCampaignAudience {
	campaignId: string;
	audienceFilter: Record<string, unknown> | null;
	audienceSegmentId: string | null;
}

interface CampaignDetails {
	/** The name of the sender */
	fromName: string;
	/** The email **username** of the sender */
	fromEmailUsername: string;
	/** The reply-to email. When a user replies to the email, their reply will be sent to this email. */
	replyToEmail: string;
	/** The subject of the email */
	subject: string;
}

type CreateCampaign = Omit<
	UpdateCampaignEmojiAndName &
		Omit<UseMjml, "emailMessageId"> &
		UpdateCampaignAudience &
		CampaignDetails,
	"campaignId"
>;

/**
 * A client for the Loops API.
 *
 * This client is responsible for creating a new campaign and sending it to Loops.
 */
export default class LoopsClient {
	sessionToken: string;
	cookie: string;
	baseUrl: string;

	/** @param sessionToken The session token used to authenticate with the Loops API. This is the `__Secure-next-auth.session-token` cookie. */
	/** @param baseUrl The base URL of the Loops API. Defaults to "https://app.loops.so/api". You probably don't need to change this! */
	constructor(sessionToken: string, baseUrl = "https://app.loops.so/api") {
		this.sessionToken = sessionToken;
		this.cookie = `__Secure-next-auth.session-token=${sessionToken}`;
		this.baseUrl = baseUrl;
	}

	async #apiRequest(
		url: string,
		method: "GET" | "POST" | "PUT" | "DELETE",
		body: Record<string, unknown>,
	) {
		const response = await fetch(`${this.baseUrl}${url}`, {
			headers: {
				"content-type": "application/json",
				cookie: this.cookie,
			},
			body: JSON.stringify(body),
			method,
		});
		if (!response.ok) {
			throw new Error(
				`Failed to send request: ${response.statusText} (${method} ${url})`,
			);
		}
		const json = await response.json();
		if (json.success === false) {
			throw new Error(`Failed to send request: ${json} (${method} ${url})`);
		}
		return json;
	}

	/**
	 * Creates a new campaign and returns the campaign ID.
	 * You'll need to use it later to update the campaign's title, emoji and message content.
	 *
	 * By default, we just use a blank template.
	 */
	// What's "ckxja0s6q0000yjr6vqouwn8a" you ask? Looks like it's Loops' default, blank template ID.
	// Tested across two different Loops accounts and teams and works as expected.
	async createCampaignAndReturnId(templateId = "ckxja0s6q0000yjr6vqouwn8a") {
		const { campaignId } = await this.#apiRequest("/campaigns/create", "POST", {
			templateId,
		});
		return campaignId as string;
	}

	/**
	 * Updates the campaign's emoji and name.
	 * You'll need to use the campaign ID returned from `createCampaignAndReturnId` later to actually send the campaign.
	 */
	async updateCampaignEmojiAndName(
		body: UpdateCampaignEmojiAndName,
	): Promise<string> {
		const response: { campaign: { emailMessage: { id: string } } } =
			await this.#apiRequest(`/campaigns/${body.campaignId}`, "PUT", {
				...body,
				campaignId: undefined,
			});
		return response.campaign.emailMessage.id;
	}

	/**
	 * Updates the campaign's audience. This is who will receive the email.
	 * You'll need to use the campaign ID returned from `createCampaignAndReturnId` later to actually send the campaign.
	 */
	async updateCampaignAudience(body: UpdateCampaignAudience) {
		await this.#apiRequest(`/campaigns/${body.campaignId}`, "PUT", {
			audienceFilter: body.audienceFilter,
			audienceSegmentId: body.audienceSegmentId,
		});
	}

	/**
	 * Schedules the campaign to send now. In other words, it sends the campaign immediately.
	 * @param campaignId The campaign ID.
	 *
	 * ```ts
	 * await client.scheduleCampaignNow(campaignId);
	 * console.log(`Campaign sent: ${campaignId}`);
	 * ```
	 */
	async scheduleCampaignNow(campaignId: string) {
		await this.#apiRequest(`/campaigns/${campaignId}`, "PUT", {
			scheduling: {
				method: "now",
			},
		});

		await this.#apiRequest(`/campaigns/${campaignId}`, "PUT", {
			status: "Scheduled",
		});
	}

	/**
	 * Sets the campaign's from name.
	 * @param emailMessageId The email message ID.
	 * @param fromName The from name.
	 *
	 * ```ts
	 * await client.setFromName(emailMessageId, "Mahad Kalam");
	 * ```
	 */
	async setFromName(emailMessageId: string, fromName: string) {
		await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
			fromName,
		});
	}

	/**
	 * Sets the campaign's from email **username**.
	 *
	 * For instance, if your Loops domain is `hackclub.com`, then by using the following code:
	 * ```ts
	 * await client.setFromEmailUsername(emailMessageId, "foo");
	 * ```
	 * The from email will be `foo@hackclub.com`.
	 */
	async setFromEmailUsername(
		emailMessageId: string,
		fromEmailUsername: string,
	) {
		await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
			fromEmail: fromEmailUsername,
		});
	}

	/**
	 * Sets the campaign's reply-to email.
	 *
	 * **Unlike the other methods, this one accepts a full email address.**
	 *
	 * If someone replies to this email, this is the email they will reply to.
	 *
	 * ```ts
	 * await client.setReplyToEmail(emailMessageId, "foo@hackclub.com");
	 * ```
	 */
	async setReplyToEmail(emailMessageId: string, replyToEmail: string) {
		await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
			replyToEmail,
		});
	}

	/**
	 * Sets the campaign's subject.
	 * @param emailMessageId The email message ID.
	 * @param subject The subject.
	 *
	 * ```ts
	 * await client.setSubject(emailMessageId, "Hey, welcome to Hack Club!");
	 * ```
	 */
	async setSubject(emailMessageId: string, subject: string) {
		await this.#apiRequest(`/emailMessages/${emailMessageId}/update`, "PUT", {
			subject,
		});
	}

	/**
	 * Uploads the campaign's MJML.
	 * @param zipFile a ZIP file containing an `index.mjml` file, as well as any images it references.
	 */
	async uploadMjml(body: UseMjml) {
		await this.#apiRequest(
			`/emailMessages/${body.emailMessageId}/update`,
			"PUT",
			{
				editorType: "MJML",
			},
		);

		const {
			filename,
			presignedUrl,
		}: { filename: string; presignedUrl: string } = (
			await this.#apiRequest(
				"/trpc/emailMessages.getPresignedMjmlUpload",
				"POST",
				{
					json: {
						emailMessageId: body.emailMessageId,
					},
				},
			)
		).result.data.json;

		const s3Response = await fetch(presignedUrl, {
			method: "PUT",
			body: body.zipFile,
			headers: {
				"Content-Type": body.zipFile.type,
			},
		});
		if (!s3Response.ok) {
			throw new Error(`Failed to upload MJML to S3: ${s3Response.statusText}`);
		}

		await this.#apiRequest(
			`/emailMessages/${body.emailMessageId}/upload-mjml-zip`,
			"POST",
			{
				filename,
			},
		);
	}

	/**
	 * Creates **and sends** a campaign.
	 * @param campaign The campaign data.
	 * @returns The campaign ID.
	 *
	 * ```ts
	 * const campaignId = await client.createAndSendCampaign({
	 *    emailMessageId: "ckxja0s6q0000yjr6vqouwn8a",
	 *    templateId: "ckxja0s6q0000yjr6vqouwn8a",
	 * });
	 * ```
	 */
	async createAndSendCampaign(campaign: CreateCampaign) {
		const campaignId = await this.createCampaign(campaign);
		await this.scheduleCampaignNow(campaignId);
		return campaignId;
	}

	/**
	 * Creates a campaign.
	 * To send it, you'll need to use the campaign ID and call `scheduleCampaignNow`.
	 * You can also use the `createAndSendCampaign` helper method, which uses this function internally.
	 * @param campaign The campaign data.
	 * @returns The campaign ID.
	 */
	async createCampaign(campaign: CreateCampaign) {
		const campaignId = await this.createCampaignAndReturnId();
		const emailMessageId = await this.updateCampaignEmojiAndName({
			emoji: campaign.emoji,
			name: campaign.name,
			campaignId,
		});

		await this.setFromName(emailMessageId, campaign.fromName);
		await this.setFromEmailUsername(emailMessageId, campaign.fromEmailUsername);
		await this.setReplyToEmail(emailMessageId, campaign.replyToEmail);
		await this.setSubject(emailMessageId, campaign.subject);

		await this.uploadMjml({
			emailMessageId,
			zipFile: campaign.zipFile,
		});

		await this.updateCampaignAudience({
			campaignId,
			audienceFilter: campaign.audienceFilter,
			audienceSegmentId: campaign.audienceSegmentId,
		});

		return campaignId;
	}
}
