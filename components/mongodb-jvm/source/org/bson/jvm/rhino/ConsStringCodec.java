/**
 * Copyright 2010-2017 Three Crickets LLC.
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
import org.mozilla.javascript.ConsString;

/**
 * A BSON codec for Rhino's native {@link ConsString}.
 * 
 * @author Tal Liron
 */
public class ConsStringCodec implements Codec<ConsString>
{
	//
	// Codec
	//

	public Class<ConsString> getEncoderClass()
	{
		return ConsString.class;
	}

	public void encode( BsonWriter writer, ConsString constString, EncoderContext encoderContext )
	{
		writer.writeString( constString.toString() );
	}

	public ConsString decode( BsonReader reader, DecoderContext decoderContext )
	{
		throw new UnsupportedOperationException( ConsStringCodec.class.getCanonicalName() + ".decode" );
	}
}
