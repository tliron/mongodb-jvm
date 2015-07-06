/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.rhino;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.mozilla.javascript.Undefined;

/**
 * A BSON codec for Rhino's native {@link Undefined}.
 * 
 * @author Tal Liron
 */
public class UndefinedCodec implements Codec<Undefined>
{
	//
	// Codec
	//

	public Class<Undefined> getEncoderClass()
	{
		return Undefined.class;
	}

	public void encode( BsonWriter writer, Undefined undefined, EncoderContext encoderContext )
	{
		writer.writeUndefined();
	}

	public Undefined decode( BsonReader reader, DecoderContext decoderContext )
	{
		reader.readUndefined();
		return (Undefined) Undefined.instance;
	}
}
